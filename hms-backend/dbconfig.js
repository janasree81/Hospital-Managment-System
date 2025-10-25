import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospitaldb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] Connected successfully to MySQL Database');
    connection.release();
  } catch (error) {
    console.error('[DB] Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();

// Export the pool for use in other files
export default pool;