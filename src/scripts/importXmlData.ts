import { importSmsData } from '../utils/importSmsData';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide the path to the XML file');
      console.error('Usage: npm run import-xml -- <path-to-xml-file>');
      process.exit(1);
    }

    const xmlFilePath = args[0];
    const absolutePath = path.resolve(xmlFilePath);
    
    console.log(`Importing SMS data from ${absolutePath}`);
    
    const result = await importSmsData(absolutePath);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      process.exit(0);
    } else {
      console.error(`❌ ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running import script:', error);
    process.exit(1);
  }
}

main(); 