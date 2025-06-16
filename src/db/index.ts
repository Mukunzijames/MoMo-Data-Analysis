import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables (only in non-edge environments)
if (typeof process !== 'undefined' && process.env) {
  dotenv.config();
}

// TEMPORARY: Hardcoded database URL for Edge Functions
// SECURITY WARNING: This is not ideal for production use
// You should use Vercel environment variables instead
const EDGE_DATABASE_URL = "postgresql://mom-data-analytics_owner:npg_pGc52kmuoFSg@ep-autumn-haze-a8vt2om2-pooler.eastus2.azure.neon.tech/mom-data-analytics?sslmode=require";

// Get DATABASE_URL from environment or use hardcoded value for Edge
const DATABASE_URL = process.env.DATABASE_URL || EDGE_DATABASE_URL;

// Initialize SQL connection
const sql = neon(DATABASE_URL);

// Initialize Drizzle ORM
const db = drizzle(sql);

export default db;
