const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/db');
const { env } = require('../config/env');

const tableName = `${env.dbPrefix}users`;
const resetTableName = `${env.dbPrefix}password_resets`;

const hashPassword = async (plainPassword) => {
  const saltRounds = 12;
  return bcrypt.hash(plainPassword, saltRounds);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
};

const createUser = async ({ firstName, lastName, email, password, role = 'customer', permissions = null, status = 'active' }) => {
  const passwordHash = await hashPassword(password);

  const [result] = await pool.query(
    `INSERT INTO ${tableName} (first_name, last_name, email, password_hash, role, status, permissions) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email.trim().toLowerCase(), passwordHash, role, status, permissions ? JSON.stringify(permissions) : null]
  );

  return {
    id: result.insertId,
    firstName,
    lastName,
    email,
    role,
    status,
    permissions,
  };
};

const getUserById = async (id) => {
  const [rows] = await pool.query(`SELECT id, first_name, last_name, email, role, status, permissions, created_at FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
  if (rows[0]?.permissions && typeof rows[0].permissions === 'string') rows[0].permissions = JSON.parse(rows[0].permissions);
  return rows[0] || null;
};

const updateUserProfile = async (id, { firstName, lastName, email }) => {
  const existing = await getUserById(id);
  if (!existing) return null;
  await pool.query(
    `UPDATE ${tableName} SET first_name = ?, last_name = ?, email = ? WHERE id = ? AND status = 'active'`,
    [String(firstName).trim(), String(lastName).trim(), String(email).trim().toLowerCase(), id]
  );
  return getUserById(id);
};

const changePassword = async (id, currentPassword, newPassword) => {
  const [rows] = await pool.query(`SELECT password_hash FROM ${tableName} WHERE id = ? LIMIT 1`, [id]);
  if (!rows[0] || !(await comparePassword(currentPassword, rows[0].password_hash))) return false;
  const passwordHash = await hashPassword(newPassword);
  await pool.query(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
  return true;
};

const createPasswordReset = async (email) => {
  const user = await findUserByEmail(String(email).trim().toLowerCase());
  if (!user || user.status !== 'active') return null;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query(`DELETE FROM ${resetTableName} WHERE user_id = ? OR expires_at < NOW()`, [user.id]);
  await pool.query(`INSERT INTO ${resetTableName} (user_id, token_hash, expires_at) VALUES (?, ?, ?)`, [user.id, tokenHash, expiresAt]);
  return { token, email: user.email, firstName: user.first_name };
};

const sendPasswordResetEmail = async ({ email, firstName, token }) => {
  const smtpService = require('./smtpService');
  const config = await smtpService.getConfig();
  if (!config.host || !config.from) return false;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  });
  const resetUrl = `${env.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: 'Reset your Claude Commerce password',
    text: `Hello ${firstName}, use this link within one hour to reset your password: ${resetUrl}`,
  });
  return true;
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash('sha256').update(String(token || '')).digest('hex');
  const passwordHash = await hashPassword(newPassword);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT user_id FROM ${resetTableName} WHERE token_hash = ? AND expires_at > NOW() LIMIT 1 FOR UPDATE`,
      [tokenHash]
    );
    if (!rows[0]) {
      await connection.rollback();
      return false;
    }
    await connection.query(`UPDATE ${tableName} SET password_hash = ? WHERE id = ?`, [passwordHash, rows[0].user_id]);
    await connection.query(`DELETE FROM ${resetTableName} WHERE user_id = ?`, [rows[0].user_id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  createToken,
  findUserByEmail,
  createUser,
  getUserById,
  updateUserProfile,
  changePassword,
  createPasswordReset,
  sendPasswordResetEmail,
  resetPassword,
};
