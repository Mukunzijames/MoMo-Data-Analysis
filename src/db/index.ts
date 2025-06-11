import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql);

export default db;
