const pool = require('../config/db');
const { env } = require('../config/env');

const table = `${env.dbPrefix}addresses`;
const fields = `id, type, first_name AS firstName, last_name AS lastName, address_1 AS address,
  address_2 AS address2, city, state, postal_code AS zip, country, phone, is_default AS isDefault`;

const normalize = (payload) => {
  const type = payload.type || 'shipping';
  const firstName = String(payload.firstName || '').trim();
  const lastName = String(payload.lastName || '').trim();
  const address = String(payload.address || '').trim();
  const city = String(payload.city || '').trim();
  const zip = String(payload.zip || '').trim();
  const country = String(payload.country || 'US').trim();
  if (!['billing', 'shipping'].includes(type) || !firstName || !lastName || !address || !city || !zip || !country) {
    const error = new Error('Address type, name, street address, city, postal code, and country are required');
    error.statusCode = 422;
    throw error;
  }
  return {
    type, firstName, lastName, address,
    address2: String(payload.address2 || '').trim() || null,
    city,
    state: String(payload.state || '').trim() || null,
    zip, country,
    phone: String(payload.phone || '').trim() || null,
    isDefault: Boolean(payload.isDefault),
  };
};

const listForUser = async (userId) => {
  const [rows] = await pool.query(`SELECT ${fields} FROM ${table} WHERE user_id = ? ORDER BY is_default DESC, created_at DESC, id DESC`, [userId]);
  return rows.map((row) => ({ ...row, isDefault: Boolean(row.isDefault) }));
};

const createForUser = async (userId, payload) => {
  const address = normalize(payload);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (address.isDefault) await connection.query(`UPDATE ${table} SET is_default = 0 WHERE user_id = ? AND type = ?`, [userId, address.type]);
    const [result] = await connection.query(
      `INSERT INTO ${table} (user_id, type, first_name, last_name, address_1, address_2, city, state, postal_code, country, phone, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, address.type, address.firstName, address.lastName, address.address, address.address2, address.city, address.state, address.zip, address.country, address.phone, address.isDefault ? 1 : 0]
    );
    await connection.commit();
    return { id: result.insertId, ...address };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateForUser = async (userId, id, payload) => {
  const address = normalize(payload);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [owned] = await connection.query(`SELECT id FROM ${table} WHERE id = ? AND user_id = ? FOR UPDATE`, [id, userId]);
    if (!owned[0]) {
      await connection.rollback();
      return null;
    }
    if (address.isDefault) await connection.query(`UPDATE ${table} SET is_default = 0 WHERE user_id = ? AND type = ? AND id <> ?`, [userId, address.type, id]);
    await connection.query(
      `UPDATE ${table} SET type = ?, first_name = ?, last_name = ?, address_1 = ?, address_2 = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [address.type, address.firstName, address.lastName, address.address, address.address2, address.city, address.state, address.zip, address.country, address.phone, address.isDefault ? 1 : 0, id, userId]
    );
    await connection.commit();
    return { id: Number(id), ...address };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteForUser = async (userId, id) => {
  const [result] = await pool.query(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, userId]);
  return result.affectedRows > 0;
};

module.exports = { listForUser, createForUser, updateForUser, deleteForUser };