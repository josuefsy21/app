import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
});

export async function runMigrations() {
    const sqlPath = path.join(__dirname, 'ddl.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    if (!sql.trim()) return;

    await pool.query(sql);

}

export async function closeDatabase() {
    await pool.end();
}

export default pool;
