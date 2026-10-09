const app = require('./app');
const { env } = require('./config/env');
const { initializeDatabase } = require('./config/initDatabase');

const PORT = env.port;

(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.warn('Database initialization warning:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Claude E-commerce backend running on http://localhost:${PORT}`);
  });
})();
