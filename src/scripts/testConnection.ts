import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    console.log('Testing database connection...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in .env file');
    }
    
    console.log('Database URL found in environment variables');
    
    const sql = neon(process.env.DATABASE_URL);
    
    const db = drizzle(sql);
    
    const result = await sql`SELECT NOW() as current_time`;
    
    console.log('✅ Database connection successful!');
    console.log(`Current database time: ${result[0].current_time}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

main(); 