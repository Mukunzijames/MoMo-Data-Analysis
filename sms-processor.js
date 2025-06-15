// SMS Processor for Mobile Money Transactions
// This script parses the XML data containing mobile money SMS messages,
// categorizes them based on transaction type, and exports the data to JSON.

const fs = require('fs');
const xml2js = require('xml2js');

// Define transaction categories
const CATEGORIES = {
  INCOMING_MONEY: 'incoming_money',
  PAYMENT_TO_CODE: 'payment_to_code',
  TRANSFER_TO_MOBILE: 'transfer_to_mobile',
  BANK_DEPOSIT: 'bank_deposit',
  AIRTIME_PAYMENT: 'airtime_payment',
  POWER_PAYMENT: 'cash_power_payment',
  THIRD_PARTY: 'third_party_transaction',
  WITHDRAWAL: 'withdrawal_from_agent',
  BUNDLE_PURCHASE: 'internet_bundle_purchase',
  OTHER: 'other'
};

// Regular expressions for categorizing messages
const REGEX = {
  INCOMING_MONEY: /You have received (\d+(?:,?\d+)*) RWF from (.+?) \(\*+\d+\) on your mobile money account/i,
  PAYMENT_TO_CODE: /TxId: (\d+)\. Your payment of ([\d,]+) RWF to (.+?) \d+ has been completed/i,
  TRANSFER_TO_MOBILE: /\*165\*S\*([\d,]+) RWF transferred to (.+?) \(250\d+\) from \d+/i,
  BANK_DEPOSIT: /\*113\*R\*A bank deposit of (\d+(?:,?\d+)*) RWF has been added to your mobile money account/i,
  AIRTIME_PAYMENT: /Your payment of (\d+(?:,?\d+)*) RWF to Airtime with token/i,
  POWER_PAYMENT: /Your payment of (\d+(?:,?\d+)*) RWF to MTN Cash Power with token/i,
  THIRD_PARTY: /A transaction of (\d+(?:,?\d+)*) RWF by (.+?) on your MOMO account was successfully completed/i,
  WITHDRAWAL: /withdrawn (\d+(?:,?\d+)*) RWF from your mobile money account/i,
  BUNDLE_PURCHASE: /(Your payment of (\d+(?:,?\d+)*) RWF to Bundles and Packs|Umaze kugura .+?igura (\d+(?:,?\d+)*) RWF)/i
};

// Helper function to clean numeric values
function cleanNumericValue(value) {
  if (!value) return 0;
  // Remove commas and convert to number
  return parseFloat(value.replace(/,/g, ''));
}

// Helper function to extract date from Unix timestamp
function formatDate(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toISOString();
}

// Parse an SMS message and categorize it
function parseMessage(sms) {
  const body = sms.$.body;
  const date = formatDate(sms.$.date);
  const readableDate = sms.$.readable_date;
  let category = CATEGORIES.OTHER;
  let amount = 0;
  let recipient = '';
  let transactionId = '';
  let balance = 0;
  let fee = 0;
  
  // Extract balance with regex
  const balanceMatch = body.match(/([nN]ew balance:?|NEW BALANCE :)([\d,]+) RWF/i);
  if (balanceMatch) {
    balance = cleanNumericValue(balanceMatch[2]);
  }
  
  // Extract fee with regex
  const feeMatch = body.match(/[fF]ee (?:was|paid): ?([\d,]+) RWF/i);
  if (feeMatch) {
    fee = cleanNumericValue(feeMatch[1]);
  }
  
  // Categorize the message based on content
  if (REGEX.INCOMING_MONEY.test(body)) {
    category = CATEGORIES.INCOMING_MONEY;
    const match = body.match(REGEX.INCOMING_MONEY);
    amount = cleanNumericValue(match[1]);
    recipient = match[2].trim();
    
    // Try to extract transaction ID
    const txIdMatch = body.match(/Financial Transaction Id: (\d+)/i);
    if (txIdMatch) {
      transactionId = txIdMatch[1];
    }
  } 
  else if (REGEX.PAYMENT_TO_CODE.test(body)) {
    category = CATEGORIES.PAYMENT_TO_CODE;
    const match = body.match(REGEX.PAYMENT_TO_CODE);
    transactionId = match[1];
    amount = cleanNumericValue(match[2]);
    recipient = match[3].trim();
  } 
  else if (REGEX.TRANSFER_TO_MOBILE.test(body)) {
    category = CATEGORIES.TRANSFER_TO_MOBILE;
    const match = body.match(REGEX.TRANSFER_TO_MOBILE);
    amount = cleanNumericValue(match[1]);
    recipient = match[2].trim();
    
    // Try to extract time
    const timeMatch = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/i);
    if (timeMatch) {
      // Additional timestamp information could be extracted if needed
    }
  } 
  else if (REGEX.BANK_DEPOSIT.test(body)) {
    category = CATEGORIES.BANK_DEPOSIT;
    const match = body.match(REGEX.BANK_DEPOSIT);
    amount = cleanNumericValue(match[1]);
  }
  else if (REGEX.AIRTIME_PAYMENT.test(body)) {
    category = CATEGORIES.AIRTIME_PAYMENT;
    const match = body.match(REGEX.AIRTIME_PAYMENT);
    amount = cleanNumericValue(match[1]);
    
    // Try to extract transaction ID
    const txIdMatch = body.match(/TxId:(\d+)/i);
    if (txIdMatch) {
      transactionId = txIdMatch[1];
    }
  }
  else if (REGEX.POWER_PAYMENT.test(body)) {
    category = CATEGORIES.POWER_PAYMENT;
    const match = body.match(REGEX.POWER_PAYMENT);
    amount = cleanNumericValue(match[1]);
    
    // Extract meter token
    const tokenMatch = body.match(/with token (\S+)/i);
    if (tokenMatch) {
      recipient = tokenMatch[1]; // Using recipient field for meter token
    }
  }
  else if (REGEX.THIRD_PARTY.test(body)) {
    category = CATEGORIES.THIRD_PARTY;
    const match = body.match(REGEX.THIRD_PARTY);
    amount = cleanNumericValue(match[1]);
    recipient = match[2].trim();
  }
  else if (REGEX.WITHDRAWAL.test(body)) {
    category = CATEGORIES.WITHDRAWAL;
    const match = body.match(REGEX.WITHDRAWAL);
    amount = cleanNumericValue(match[1]);
    
    // Try to extract agent info
    const agentMatch = body.match(/via agent: (.+?) \(/i);
    if (agentMatch) {
      recipient = agentMatch[1]; // Using recipient field for agent name
    }
  }
  else if (REGEX.BUNDLE_PURCHASE.test(body)) {
    category = CATEGORIES.BUNDLE_PURCHASE;
    const match = body.match(REGEX.BUNDLE_PURCHASE);
    if (match[2]) {
      amount = cleanNumericValue(match[2]);
    } else if (match[3]) {
      amount = cleanNumericValue(match[3]);
    }
  }
  
  // Return parsed message data
  return {
    category,
    date,
    readableDate,
    amount,
    recipient,
    transactionId,
    balance,
    fee,
    rawMessage: body
  };
}

// Main function to parse XML and process SMS data
async function processSmsData() {
  try {
    // Read the XML file
    const xmlData = fs.readFileSync('modified_sms_v2.xml', 'utf8');
    
    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    // Process SMS messages
    const smsMessages = result.smses.sms;
    console.log(`Found ${smsMessages.length} SMS messages to process.`);
    
    // Filter only M-Money messages
    const momoMessages = smsMessages.filter(sms => 
      sms.$.address === 'M-Money' && sms.$.body.trim() !== ''
    );
    
    console.log(`Found ${momoMessages.length} Mobile Money related messages.`);
    
    // Parse and categorize each message
    const processedData = momoMessages.map(parseMessage);
    
    // Group by categories for analytics
    const categorizedData = {};
    for (const category of Object.values(CATEGORIES)) {
      categorizedData[category] = processedData.filter(msg => msg.category === category);
    }
    
    // Calculate statistics for each category
    const statistics = {};
    Object.keys(categorizedData).forEach(category => {
      const transactions = categorizedData[category];
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const count = transactions.length;
      
      statistics[category] = {
        count,
        totalAmount,
        averageAmount: count > 0 ? totalAmount / count : 0
      };
    });
    
    // Create final data object
    const finalData = {
      totalSmsProcessed: momoMessages.length,
      statistics,
      transactions: {
        all: processedData,
        byCategory: categorizedData
      },
      processedAt: new Date().toISOString()
    };
    
    // Write to JSON file
    fs.writeFileSync('momo_transactions.json', JSON.stringify(finalData, null, 2));
    console.log('Processing complete. Data saved to momo_transactions.json');
    
    // Generate summary for console
    console.log('\nSummary:');
    Object.keys(statistics).forEach(category => {
      const { count, totalAmount } = statistics[category];
      console.log(`${category}: ${count} transactions, Total: ${totalAmount.toLocaleString()} RWF`);
    });
    
  } catch (error) {
    console.error('Error processing SMS data:', error);
  }
}

// Run the processor
processSmsData(); 