const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { env } = require('./env');

const migrationPath = path.resolve(__dirname, '../../migrations/001_init_schema.sql');
const seedPath = path.resolve(__dirname, '../../migrations/002_seed_demo_data.sql');
const resetMigrationPath = path.resolve(__dirname, '../../migrations/003_password_resets.sql');
const rbacCmsMigrationPath = path.resolve(__dirname, '../../migrations/004_rbac_cms.sql');

const readSqlFile = (filePath) => fs.readFileSync(filePath, 'utf8');

const initializeDatabase = async () => {
  const connection = await mysql.createConnection({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${env.dbName}\`;`);

    const [tableRows] = await connection.query(
      'SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = ?',
      [env.dbName],
    );

    const tableCount = Number(tableRows[0]?.table_count || 0);
    if (tableCount === 0) {
      const migrationSql = readSqlFile(migrationPath);
      await connection.query(migrationSql);
    }

    const [userRows] = await connection.query('SELECT COUNT(*) AS user_count FROM ce_users');
    if (Number(userRows[0]?.user_count || 0) === 0) {
      const seedSql = readSqlFile(seedPath);
      await connection.query(seedSql);
    }

    await connection.query(readSqlFile(resetMigrationPath));
    const [[permissionsColumn]] = await connection.query(
      "SELECT COUNT(*) AS column_count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'ce_users' AND column_name = 'permissions'",
      [env.dbName]
    );
    if (Number(permissionsColumn.column_count) === 0) {
      await connection.query(readSqlFile(rbacCmsMigrationPath));
    }

    return true;
  } finally {
    await connection.end();
  }
};

module.exports = { initializeDatabase };

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log(`Database initialized for ${env.dbName}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error.message);
      process.exit(1);
    });
}
