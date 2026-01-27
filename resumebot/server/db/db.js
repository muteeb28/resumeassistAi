import pg from 'pg';
const { Pool } = pg;

let pool;

export const connectDB = async () => {
    if (pool) return pool;

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const client = await pool.connect();
        console.log('🚀 Connected to Neon PostgreSQL via pg Pool');

        // Create users table if it doesn't exist
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        client.release();
    } catch (error) {
        console.error('❌ Neon Connection Error:', error.message);
    }
};

export const getPool = () => {
    if (!pool) throw new Error('Database pool not initialized. Call connectDB() first.');
    return pool;
};

export default { connectDB, getPool };
