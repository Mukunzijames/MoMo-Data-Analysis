import { exec } from 'child_process';
import path from 'path';
import importMomoTransactions from './import-momo-transactions';
import seedMomoCategories from './seed-momo-categories';
import { promisify } from 'util';

// Convert exec to use promises
const execPromise = promisify(exec);

/**
 * Master function to process SMS data from XML and import into database
 */
async function processAndImportSms(xmlFilePath: string = '../../modified_sms_v2.xml') {
  try {
    console.log('========= SMS PROCESSING PIPELINE START =========');
    
    // Step 1: Seed the transaction categories
    console.log('\n=== STEP 1: Seeding transaction categories ===');
    await seedMomoCategories();
    
    // Step 2: Process XML file using sms-processor.js
    console.log('\n=== STEP 2: Processing XML data ===');
    const smsProcessorPath = path.resolve(__dirname, '../../sms-processor.js');
    console.log(`Running SMS processor: ${smsProcessorPath}`);
    
    try {
      const { stdout, stderr } = await execPromise(`node ${smsProcessorPath}`);
      if (stderr) {
        console.error('SMS processing stderr:', stderr);
      }
      console.log('SMS processing stdout:', stdout);
    } catch (error) {
      console.error('Error executing SMS processor:', error);
      throw new Error('SMS processing failed');
    }
    
    // Step 3: Import processed data into database
    console.log('\n=== STEP 3: Importing processed data into database ===');
    const importResult = await importMomoTransactions();
    
    if (!importResult.success) {
      throw new Error(`Import failed: ${importResult.error}`);
    }
    
    console.log('\n========= SMS PROCESSING PIPELINE COMPLETE =========');
    console.log(`Successfully processed and imported ${importResult.transactionsCount} transactions`);
    console.log(`Batch ID: ${importResult.batchId}`);
    
    return {
      success: true,
      batchId: importResult.batchId,
      transactionsCount: importResult.transactionsCount
    };
    
  } catch (error) {
    console.error('Error in SMS processing pipeline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run if executed directly
if (require.main === module) {
  processAndImportSms()
    .then((result) => {
      console.log('Process complete:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Process failed:', error);
      process.exit(1);
    });
}

export default processAndImportSms; 