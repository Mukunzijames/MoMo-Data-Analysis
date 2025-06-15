import fs from 'fs';
import path from 'path';
import db from '../db';
import { sql } from 'drizzle-orm';
import { 
  momoTransactions, 
  rawMomoSms, 
  incomingMoneyTransactions,
  cashPowerTransactions,
  thirdPartyTransactions,
  withdrawalTransactions,
  mobileTransferTransactions,
  bundleTransactions,
  bankTransactions,
  momoStatistics
} from '../db/schema';

// Types for processed data
interface ProcessedTransaction {
  category: string;
  date: string;
  readableDate: string;
  amount: number;
  recipient: string;
  transactionId: string;
  balance: number;
  fee: number;
  rawMessage: string;
}

interface CategoryStatistics {
  count: number;
  totalAmount: number;
  averageAmount: number;
}

interface MomoTransactionsData {
  totalSmsProcessed: number;
  statistics: {
    [key: string]: CategoryStatistics;
  };
  transactions: {
    all: ProcessedTransaction[];
    byCategory: {
      [key: string]: ProcessedTransaction[];
    };
  };
  processedAt: string;
}

// Helper function to generate a batch ID
function generateBatchId(): string {
  return `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Main import function
async function importMomoTransactions(filePath: string = '../../momo_transactions.json') {
  try {
    // Read and parse the JSON file
    const resolvedPath = path.resolve(__dirname, filePath);
    console.log(`Attempting to read file from: ${resolvedPath}`);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    const rawData = fs.readFileSync(resolvedPath, 'utf8');
    const data: MomoTransactionsData = JSON.parse(rawData);
    
    console.log(`Found ${data.totalSmsProcessed} SMS messages with ${data.transactions.all.length} transactions to import.`);
    
    // Generate a batch ID for this import
    const batchId = generateBatchId();
    console.log(`Import batch ID: ${batchId}`);
    
    // Begin import process
    console.log('Starting transaction import...');
    
    // Step 1: Insert raw SMS messages
    for (const transaction of data.transactions.all) {
      // Insert raw SMS
      const [rawSms] = await db.insert(rawMomoSms).values({
        address: 'M-Money',
        date: new Date(transaction.date),
        readableDate: transaction.readableDate,
        body: transaction.rawMessage,
        processed: true,
        importBatch: batchId,
        importDate: new Date()
      }).returning();
      
      // Insert main transaction record
      const [momoTx] = await db.insert(momoTransactions).values({
        category: transaction.category,
        transactionDate: new Date(transaction.date),
        amount: transaction.amount,
        recipient: transaction.recipient || null,
        transactionId: transaction.transactionId || null,
        balance: transaction.balance || null,
        fee: transaction.fee || 0,
        rawSmsId: rawSms.id,
        readableDate: transaction.readableDate,
        processed: true
      } as any).returning();
      
      // Insert specialized transaction records based on category
      switch (transaction.category) {
        case 'incoming_money':
          await db.insert(incomingMoneyTransactions).values({
            transactionId: transaction.transactionId || null,
            sender: transaction.recipient || 'Unknown', // Using recipient field which contains sender name
            amount: transaction.amount,
            transactionDate: new Date(transaction.date),
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any);
          break;
          
        case 'cash_power_payment':
          await db.insert(cashPowerTransactions).values({
            transactionId: transaction.transactionId || null,
            token: transaction.recipient || null, // Token is stored in recipient field
            amount: transaction.amount,
            transactionDate: new Date(transaction.date),
            fee: transaction.fee || 0,
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any);
          break;
          
        case 'third_party_transaction':
          await db.insert(thirdPartyTransactions).values({
            externalId: transaction.transactionId || null,
            vendor: transaction.recipient || 'Unknown Vendor',
            amount: transaction.amount, 
            transactionDate: new Date(transaction.date),
            fee: transaction.fee || 0,
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any);
          break;
          
        case 'withdrawal_from_agent':
          await db.insert(withdrawalTransactions).values({
            transactionId: transaction.transactionId || null,
            agentName: transaction.recipient || 'Unknown Agent',
            amount: transaction.amount,
            transactionDate: new Date(transaction.date),
            fee: transaction.fee || 0,
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any);
          break;
          
        case 'transfer_to_mobile':
          await db.insert(mobileTransferTransactions).values({
            recipient: transaction.recipient || 'Unknown Recipient',
            amount: transaction.amount,
            transactionDate: new Date(transaction.date),
            fee: transaction.fee || 0,
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any);
          break;
          
        case 'internet_bundle_purchase':
          await db.insert(bundleTransactions).values({
            transactionId: transaction.transactionId || null,
            amount: transaction.amount,
            transactionDate: new Date(transaction.date),
            fee: transaction.fee || 0,
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any);
          break;
          
        case 'bank_deposit':
          await db.insert(bankTransactions).values({
            transactionId: transaction.transactionId || null,
            amount: transaction.amount,
            transactionType: 'deposit',
            transactionDate: new Date(transaction.date),
            fee: transaction.fee || 0,
            balance: transaction.balance || null,
            mainTransactionId: momoTx.id
          } as any );
          break;
      }
    }
    
    // Step 3: Import statistics
    for (const [category, stats] of Object.entries(data.statistics)) {
      await db.insert(momoStatistics).values({
        category: category,
        count: stats.count,
        totalAmount: stats.totalAmount,
        averageAmount: stats.averageAmount,
        minAmount: Math.min(...data.transactions.byCategory[category]?.map(tx => tx.amount) || [0]),
        maxAmount: Math.max(...data.transactions.byCategory[category]?.map(tx => tx.amount) || [0]),
        lastUpdated: new Date()
      } as any).onConflictDoUpdate({
        target: momoStatistics.category,
        set: {
          count: sql`${stats.count}`,
          totalAmount: sql`${stats.totalAmount}`,
          averageAmount: sql`${stats.averageAmount}`, 
          lastUpdated: new Date()
        }
      });
    }
    
    console.log(`Successfully imported ${data.transactions.all.length} MoMo transactions`);
    return {
      success: true,
      batchId,
      transactionsCount: data.transactions.all.length
    };
    
  } catch (error) {
    console.error('Error importing MoMo transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run import function if this script is executed directly
if (require.main === module) {
  // Use the first command-line argument as file path or default
  const filePath = process.argv[2] || '../../momo_transactions.json';
  
  importMomoTransactions(filePath)
    .then((result) => {
      console.log('Import process complete:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}

export default importMomoTransactions; 