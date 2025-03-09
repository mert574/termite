import pg from 'pg';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,  // Increased from 10_000
    statement_timeout: 0,            // Disabled timeout
    query_timeout: 0,               // Disabled timeout
    keepAlive: true
});

// Helper function to check database connection
export async function checkConnection() {
    try {
        const client = await pool.connect();
        client.release();
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// Cleanup function for graceful shutdown
export async function closeConnection() {
    await pool.end();
}

export { pool }; 