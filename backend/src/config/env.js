const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

dotenv.config({ path: path.resolve(__dirname, '../../.env.example') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: Number(process.env.DB_PORT) || 3306,
  dbName: process.env.DB_NAME || 'claude_ecommerce',
  dbUser: process.env.DB_USER || 'tpss',
  dbPassword: process.env.DB_PASSWORD || '1',
  dbPrefix: process.env.DB_PREFIX || 'ce_',
  jwtSecret: process.env.JWT_SECRET || 'change_me_in_production',
  paymentCredentialsKey: process.env.PAYMENT_CREDENTIALS_KEY || process.env.JWT_SECRET || 'change_me_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  smtpFrom: process.env.SMTP_FROM || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',').map((value) => value.trim()).filter(Boolean),
};

module.exports = { env };
