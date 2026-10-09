const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/db');
const { env } = require('../config/env');

const settingKeys = {
  host: 'smtp_host',
  port: 'smtp_port',
  user: 'smtp_user',
  password: 'smtp_password',
  from: 'smtp_from',
};
const envKeys = { host: 'SMTP_HOST', port: 'SMTP_PORT', user: 'SMTP_USER', password: 'SMTP_PASSWORD', from: 'SMTP_FROM' };
const key = () => crypto.createHash('sha256').update(env.paymentCredentialsKey).digest();
const encrypt = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${ciphertext.toString('hex')}`;
};
const decrypt = (value) => {
  if (!String(value).startsWith('enc:v1:')) return value;
  const [, , iv, tag, data] = String(value).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
};

const getConfig = async () => {
  const keys = Object.values(settingKeys);
  const [rows] = await pool.query(`SELECT key_name, value FROM ${env.dbPrefix}settings WHERE key_name IN (?, ?, ?, ?, ?)`, keys);
  const saved = new Map(rows.map((row) => [row.key_name, row.value]));
  return Object.fromEntries(Object.entries(settingKeys).map(([field, setting]) => {
    const value = saved.has(setting) ? decrypt(saved.get(setting)) : process.env[envKeys[field]] || '';
    return [field, field === 'port' ? Number(value) || 587 : value];
  }));
};

const getStatus = async () => {
  const config = await getConfig();
  return { host: config.host, port: config.port, from: config.from, userConfigured: Boolean(config.user), passwordConfigured: Boolean(config.password), configured: Boolean(config.host && config.from) };
};

const saveConfig = async (payload) => {
  const allowed = Object.keys(settingKeys);
  for (const [field, value] of Object.entries(payload || {})) {
    if (!allowed.includes(field) || typeof value !== 'string') {
      const error = new Error(`Invalid SMTP setting: ${field}`);
      error.statusCode = 422;
      throw error;
    }
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [field, value] of Object.entries(payload)) {
      if (!value.trim()) continue;
      const stored = field === 'password' ? encrypt(value) : value.trim();
      await connection.query(
        `INSERT INTO ${env.dbPrefix}settings (key_name, value, description) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)`,
        [settingKeys[field], stored, `SMTP configuration: ${field}`]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getStatus();
};

const testConnection = async () => {
  const config = await getConfig();
  if (!config.host || !config.from) return { working: false, message: 'SMTP host and sender address are required.' };
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    await transporter.verify();
    return { working: true, message: 'SMTP server accepted the connection and authentication.' };
  } catch (error) {
    return { working: false, message: error.message || 'SMTP connection test failed.' };
  }
};

module.exports = { getConfig, getStatus, saveConfig, testConnection };