import { exec } from 'child_process';
import { promisify } from 'util';
import db from '../db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

// Convert exec to use promises
const execPromise = promisify(exec);

/**
 * Generate and apply database migrations
 */
async function applyMigrations() {
  try {
    console.log('=== Starting database migration process ===');
    
    // Step 1: Generate migrations
    console.log('\nGenerating migration files...');
    try {
      const { stdout, stderr } = await execPromise('npx drizzle-kit generate');
      if (stderr) {
        console.warn('Warning during migration generation:', stderr);
      }
      console.log('Migration generation output:', stdout);
    } catch (error) {
      console.error('Error generating migrations:', error);
      throw new Error('Migration generation failed');
    }
    
    // Step 2: Apply migrations
    console.log('\nApplying migrations to database...');
    try {
      const migrationFolder = path.resolve(__dirname, '../../src/db/migrations');
      await migrate(db, { migrationsFolder: migrationFolder });
    } catch (error) {
      console.error('Error applying migrations:', error);
      throw new Error('Migration application failed');
    }
    
    console.log('\n=== Migration process completed successfully ===');
    return { success: true };
  } catch (error) {
    console.error('Migration process failed:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Execute if run directly
if (require.main === module) {
  applyMigrations()
    .then(result => {
      console.log('Process complete:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Process failed with exception:', error);
      process.exit(1);
    });
}

export default applyMigrations; 