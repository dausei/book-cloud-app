// db.js
const { Pool } = require('pg');

const {
  DB_HOST = 'localhost',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_NAME = 'booksdb',
  DB_PORT = 5432,
} = process.env;

// 1) Connect to the default database (e.g., 'postgres') to check/create the target DB if needed.
const defaultPool = new Pool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  database: 'postgres',  // Connect to the default DB first
});

// 2) Check if the target database exists; if not, create it.
async function ensureDatabaseExists() {
  const client = await defaultPool.connect();
  try {
    const checkDbExistsQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const res = await client.query(checkDbExistsQuery, [DB_NAME]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`Database '${DB_NAME}' created successfully.`);
    } else {
      console.log(`Database '${DB_NAME}' already exists.`);
    }
  } catch (error) {
    console.error('Error checking/creating database:', error);
  } finally {
    client.release();
  }
}

// 3) Create a new Pool for the target database.
function getDatabasePool() {
  return new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: DB_NAME,
  });
}

module.exports = {
  ensureDatabaseExists,
  getDatabasePool,
};
