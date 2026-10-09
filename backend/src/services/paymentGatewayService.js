const pool = require('../config/db');
const { env } = require('../config/env');
const crypto = require('crypto');
const Stripe = require('stripe');

const gatewayKeys = {
  stripe: 'payment_gateway_stripe_enabled',
  paypal: 'payment_gateway_paypal_enabled',
  cod: 'payment_gateway_cod_enabled',
};

const defaults = { stripe: true, paypal: true, cod: true };
const credentialKeys = {
  stripeSecretKey: 'payment_credential_stripe_secret',
  stripePublishableKey: 'payment_credential_stripe_publishable',
  stripeWebhookSecret: 'payment_credential_stripe_webhook',
  paypalClientId: 'payment_credential_paypal_client_id',
  paypalClientSecret: 'payment_credential_paypal_client_secret',
  paypalEnvironment: 'payment_credential_paypal_environment',
};
const environmentCredentialKeys = {
  stripeSecretKey: 'STRIPE_SECRET_KEY',
  stripePublishableKey: 'STRIPE_PUBLISHABLE_KEY',
  stripeWebhookSecret: 'STRIPE_WEBHOOK_SECRET',
  paypalClientId: 'PAYPAL_CLIENT_ID',
  paypalClientSecret: 'PAYPAL_CLIENT_SECRET',
  paypalEnvironment: 'PAYPAL_ENVIRONMENT',
};

const encryptionKey = () => crypto.createHash('sha256').update(env.paymentCredentialsKey).digest();
const encrypt = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
};
const decrypt = (value) => {
  if (!String(value).startsWith('enc:v1:')) return value;
  const [, , ivHex, tagHex, encryptedHex] = String(value).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
};

const normalizeEnabled = (value) => value === true || value === 1 || value === '1' || value === 'true';

const getGatewaySettings = async () => {
  const keys = Object.values(gatewayKeys);
  const [rows] = await pool.query(
    `SELECT key_name, value FROM ${env.dbPrefix}settings WHERE key_name IN (?, ?, ?)`,
    keys
  );
  const saved = new Map(rows.map((row) => [row.key_name, row.value]));
  return Object.fromEntries(Object.entries(gatewayKeys).map(([gateway, key]) => [
    gateway,
    saved.has(key) ? normalizeEnabled(saved.get(key)) : defaults[gateway],
  ]));
};

const updateGatewaySettings = async (settings) => {
  const allowed = Object.keys(gatewayKeys);
  for (const key of Object.keys(settings || {})) {
    if (!allowed.includes(key) || typeof settings[key] !== 'boolean') {
      const error = new Error(`Invalid payment gateway setting: ${key}`);
      error.statusCode = 422;
      throw error;
    }
  }
  if (!Object.keys(settings || {}).length) {
    const error = new Error('At least one gateway setting is required');
    error.statusCode = 422;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [gateway, enabled] of Object.entries(settings)) {
      await connection.query(
        `INSERT INTO ${env.dbPrefix}settings (key_name, value, description)
         VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)`,
        [gatewayKeys[gateway], enabled ? '1' : '0', `${gateway.toUpperCase()} payment gateway enabled`]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getGatewaySettings();
};

const assertGatewayEnabled = async (gateway) => {
  const settings = await getGatewaySettings();
  if (!settings[gateway]) {
    const error = new Error(`${gateway.toUpperCase()} payments are currently disabled`);
    error.statusCode = 403;
    throw error;
  }
};

const getProviderCredentials = async () => {
  const keys = Object.values(credentialKeys);
  const [rows] = await pool.query(
    `SELECT key_name, value FROM ${env.dbPrefix}settings WHERE key_name IN (${keys.map(() => '?').join(',')})`,
    keys
  );
  const saved = new Map(rows.map((row) => [row.key_name, row.value]));
  return Object.fromEntries(Object.entries(credentialKeys).map(([field, key]) => {
    const raw = saved.has(key) ? decrypt(saved.get(key)) : process.env[environmentCredentialKeys[field]] || '';
    return [field, raw];
  }));
};

const getCredentialStatus = async () => {
  const credentials = await getProviderCredentials();
  return {
    stripe: {
      configured: Boolean(credentials.stripeSecretKey),
      publishableConfigured: Boolean(credentials.stripePublishableKey),
      webhookConfigured: Boolean(credentials.stripeWebhookSecret),
    },
    paypal: {
      configured: Boolean(credentials.paypalClientId && credentials.paypalClientSecret),
      environment: credentials.paypalEnvironment || 'sandbox',
    },
  };
};

const updateProviderCredentials = async (payload = {}) => {
  for (const [field, value] of Object.entries(payload)) {
    if (!Object.hasOwn(credentialKeys, field) || typeof value !== 'string') {
      const error = new Error(`Invalid credential field: ${field}`);
      error.statusCode = 422;
      throw error;
    }
    if (field === 'paypalEnvironment' && !['sandbox', 'live'].includes(value)) {
      const error = new Error('PayPal environment must be sandbox or live');
      error.statusCode = 422;
      throw error;
    }
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const [field, value] of Object.entries(payload)) {
      if (!value.trim()) continue;
      await connection.query(
        `INSERT INTO ${env.dbPrefix}settings (key_name, value, description) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)`,
        [credentialKeys[field], field === 'paypalEnvironment' ? value : encrypt(value), `Encrypted payment credential: ${field}`]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getCredentialStatus();
};

const testProviderCredentials = async (provider) => {
  if (!['stripe', 'paypal', 'cod'].includes(provider)) {
    const error = new Error('Unknown payment provider');
    error.statusCode = 404;
    throw error;
  }
  if (provider === 'cod') return { working: true, message: 'Cash on delivery is ready; no external credentials are required.' };

  const credentials = await getProviderCredentials();
  if (provider === 'stripe') {
    if (!credentials.stripeSecretKey) return { working: false, message: 'Stripe secret key is not configured.' };
    try {
      await new Stripe(credentials.stripeSecretKey).accounts.retrieve();
      return { working: true, message: 'Stripe credentials authenticated successfully.' };
    } catch (error) {
      return { working: false, message: error.message || 'Stripe credential check failed.' };
    }
  }

  if (!credentials.paypalClientId || !credentials.paypalClientSecret) {
    return { working: false, message: 'PayPal client ID and secret are required.' };
  }
  const baseUrl = credentials.paypalEnvironment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.paypalClientId}:${credentials.paypalClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) return { working: false, message: `PayPal rejected the credentials (HTTP ${response.status}).` };
    return { working: true, message: 'PayPal credentials authenticated successfully.' };
  } catch (error) {
    return { working: false, message: error.message || 'PayPal credential check failed.' };
  }
};

module.exports = {
  getGatewaySettings,
  updateGatewaySettings,
  assertGatewayEnabled,
  getProviderCredentials,
  getCredentialStatus,
  updateProviderCredentials,
  testProviderCredentials,
};