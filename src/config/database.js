import 'dotenv/config';
import pg from 'pg';
import fs from "fs";

const { Pool } = pg;

const pool = new Pool({
connectionString: process.env.DATABASE_URL
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
});

export default async function runMigrations() {
  const sql = fs.readFileSync('./src/config/ddl.sql', 'utf8');
  await pool.query(sql);
}

pool.on('error', (error) => {
    console.error(
        'Unexpected PostgreSQL pool error:',
        error
    );
});

export default pool;

