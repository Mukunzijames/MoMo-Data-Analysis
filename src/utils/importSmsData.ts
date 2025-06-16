import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';
import db from '../db';
import { rawSms, transactions, contacts } from '../db/schema';
import { eq } from 'drizzle-orm';
// sms interface
interface SMS {
  $: {
    protocol?: string;
    address: string;
    date: string;
    type: string;
    subject?: string;
    body: string;
    toa?: string;
    sc_toa?: string;
    service_center?: string;
    read: string;
    status?: string;
    locked?: string;
    date_sent: string;
    sub_id?: string;
    readable_date?: string;
    contact_name?: string;
  };
}
// sms collection interface
interface SMSCollection {
  smses: {
    $: {
      count: string;
      backup_set: string;
      backup_date: string;
      type: string;
    };
    sms: SMS[];
  };
}

// Helper function to parse transaction details from SMS body
const parseTransactionDetails = (body: string) => {
  const result: any = {
    transactionType: 'Other',
    amount: 0,
    fee: 0,
    balanceAfter: null,
    sender: null,
    recipient: null,
    recipientPhone: null,
    transactionId: null,
    description: body,
  };

  // Bank deposit pattern
  if (body.includes('bank deposit') && body.includes('has been added to your mobile money account')) {
    result.transactionType = 'Deposit';
    const amountMatch = body.match(/deposit of (\d+,?\.?\d*) RWF/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
    
    const balanceMatch = body.match(/NEW BALANCE :(\d+,?\.?\d*) RWF/);
    if (balanceMatch) {
      result.balanceAfter = parseFloat(balanceMatch[1].replace(',', ''));
    }
  }
  else if (body.includes('Your payment of') && body.includes('has been completed')) {
    result.transactionType = 'Payment';
    const amountMatch = body.match(/payment of ([\d,]+\.?\d*) RWF/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
    
    const recipientMatch = body.match(/to ([A-Za-z\s]+) \d+/);
    if (recipientMatch) {
      result.recipient = recipientMatch[1].trim();
    }
    
    const balanceMatch = body.match(/new balance: ([\d,]+\.?\d*) RWF/i);
    if (balanceMatch) {
      result.balanceAfter = parseFloat(balanceMatch[1].replace(',', ''));
    }
    
    const feeMatch = body.match(/Fee was ([\d,]+\.?\d*) RWF/i);
    if (feeMatch) {
      result.fee = parseFloat(feeMatch[1].replace(',', ''));
    }
    
    const txIdMatch = body.match(/TxId: (\d+)/i);
    if (txIdMatch) {
      result.transactionId = txIdMatch[1];
    }
  }
  else if (body.includes('RWF transferred to') && body.includes('from')) {
    result.transactionType = 'Transfer';
    const amountMatch = body.match(/(\d+,?\.?\d*) RWF transferred/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
    
    const recipientMatch = body.match(/transferred to ([A-Za-z\s]+) \(/);
    if (recipientMatch) {
      result.recipient = recipientMatch[1].trim();
    }
    
    const phoneMatch = body.match(/\((\d+)\)/);
    if (phoneMatch) {
      result.recipientPhone = phoneMatch[1];
    }
    
    const balanceMatch = body.match(/balance: (\d+,?\.?\d*) RWF/);
    if (balanceMatch) {
      result.balanceAfter = parseFloat(balanceMatch[1].replace(',', ''));
    }
    
    const feeMatch = body.match(/Fee was: (\d+,?\.?\d*) RWF/);
    if (feeMatch) {
      result.fee = parseFloat(feeMatch[1].replace(',', ''));
    }
    
    const accountMatch = body.match(/from (\d+) at/);
    if (accountMatch) {
      result.accountNumber = accountMatch[1];
    }
  }
  // Receipt pattern
  else if (body.includes('You have received')) {
    result.transactionType = 'Receipt';
    const amountMatch = body.match(/received (\d+,?\.?\d*) RWF/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
    
    const senderMatch = body.match(/from ([A-Za-z\s]+) \(\*/);
    if (senderMatch) {
      result.sender = senderMatch[1].trim();
    }
    
    const balanceMatch = body.match(/balance:(\d+,?\.?\d*) RWF/);
    if (balanceMatch) {
      result.balanceAfter = parseFloat(balanceMatch[1].replace(',', ''));
    }
    
    const txIdMatch = body.match(/Transaction Id: (\d+)/i);
    if (txIdMatch) {
      result.transactionId = txIdMatch[1];
    }
  }
  // Withdrawal pattern
  else if (body.includes('withdrawn') && body.includes('from your mobile money account')) {
    result.transactionType = 'Withdrawal';
    const amountMatch = body.match(/withdrawn (\d+,?\.?\d*) RWF/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
    
    const balanceMatch = body.match(/new balance: (\d+,?\.?\d*) RWF/i);
    if (balanceMatch) {
      result.balanceAfter = parseFloat(balanceMatch[1].replace(',', ''));
    }
    
    const feeMatch = body.match(/Fee paid: (\d+,?\.?\d*) RWF/i);
    if (feeMatch) {
      result.fee = parseFloat(feeMatch[1].replace(',', ''));
    }
    
    const txIdMatch = body.match(/Transaction Id: (\d+)/i);
    if (txIdMatch) {
      result.transactionId = txIdMatch[1];
    }
  }
  else if (body.includes('Your payment of') && (body.includes('to Airtime') || body.includes('to Bundles') || body.includes('to MTN Cash Power'))) {
    if (body.includes('to Airtime')) {
      result.transactionType = 'Airtime';
    } else if (body.includes('to Bundles')) {
      result.transactionType = 'Data';
    } else if (body.includes('to MTN Cash Power')) {
      result.transactionType = 'Utilities';
    }
    
    const amountMatch = body.match(/payment of (\d+,?\.?\d*) RWF/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1].replace(',', ''));
    }
    
    const balanceMatch = body.match(/balance: (\d+,?\.?\d*) RWF/);
    if (balanceMatch) {
      result.balanceAfter = parseFloat(balanceMatch[1].replace(',', ''));
    }
    
    const feeMatch = body.match(/Fee was (\d+,?\.?\d*) RWF/i);
    if (feeMatch) {
      result.fee = parseFloat(feeMatch[1].replace(',', ''));
    }
    
    const txIdMatch = body.match(/TxId:(\d+)/i);
    if (txIdMatch) {
      result.transactionId = txIdMatch[1];
    }
  }

  return result;
};

export const importSmsData = async (filePath: string) => {
  try {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    
    const result = await parseStringPromise(xmlData, { explicitArray: false });
    const smsCollection = result as unknown as SMSCollection;
    
    console.log(`Found ${smsCollection.smses.$.count} SMS messages to import`);
    
    if (!smsCollection.smses.sms) {
      console.log('No SMS messages found in the XML file');
      return { success: false, message: 'No SMS messages found in the XML file' };
    }
    
    const smsArray = Array.isArray(smsCollection.smses.sms) 
      ? smsCollection.smses.sms 
      : [smsCollection.smses.sms];
    
    console.log(`Processing ${smsArray.length} SMS messages`);
    
    for (const sms of smsArray) {
      if (sms.$.address !== 'M-Money') {
        continue;
      }
      
      try {
        const rawSmsInsert = await db.insert(rawSms).values({
          address: sms.$.address,
          date: new Date(parseInt(sms.$.date)),
          type: parseInt(sms.$.type),
          body: sms.$.body,
          serviceCenter: sms.$.service_center || null,
          readStatus: parseInt(sms.$.read),
          dateSent: sms.$.date_sent ? new Date(parseInt(sms.$.date_sent)) : null,
          contactName: sms.$.contact_name || null,
          processed: 0
        }).returning({ id: rawSms.id });
        
        const rawSmsId = rawSmsInsert[0].id;
        
        const transactionDetails = parseTransactionDetails(sms.$.body);
        
        await db.insert(transactions).values({
          transactionType: transactionDetails.transactionType,
          amount: transactionDetails.amount.toString(),
          fee: transactionDetails.fee.toString(),
          sender: transactionDetails.sender,
          recipient: transactionDetails.recipient,
          recipientPhone: transactionDetails.recipientPhone,
          transactionDate: new Date(parseInt(sms.$.date)),
          balanceAfter: transactionDetails.balanceAfter ? transactionDetails.balanceAfter.toString() : null,
          description: transactionDetails.description,
          transactionId: transactionDetails.transactionId,
          accountNumber: transactionDetails.accountNumber,
          rawSms: sms.$.body
        });
        
        if (transactionDetails.recipient) {
          const existingContacts = await db.select().from(contacts).where(eq(contacts.name, transactionDetails.recipient));
          
          if (existingContacts.length === 0) {
            await db.insert(contacts).values({
              name: transactionDetails.recipient,
              phoneNumber: transactionDetails.recipientPhone || null,
              transactionCount: 1,
              totalSent: transactionDetails.amount.toString(),
              totalReceived: "0",
              lastTransactionDate: new Date(parseInt(sms.$.date))
            });
          } else {
            const contact = existingContacts[0];
            await db.update(contacts)
              .set({
                transactionCount: (contact.transactionCount || 0) + 1,
                totalSent: (parseFloat(contact.totalSent?.toString() || '0') + transactionDetails.amount).toString(),
                lastTransactionDate: new Date(parseInt(sms.$.date)),
                phoneNumber: transactionDetails.recipientPhone || contact.phoneNumber
              })
              .where(eq(contacts.name, transactionDetails.recipient));
          }
        }
        
        if (transactionDetails.sender) {
          const existingContacts = await db.select().from(contacts).where(eq(contacts.name, transactionDetails.sender));
          
          if (existingContacts.length === 0) {
            await db.insert(contacts).values({
              name: transactionDetails.sender,
              phoneNumber: null, 
              transactionCount: 1,
              totalSent: "0",
              totalReceived: transactionDetails.amount.toString(),
              lastTransactionDate: new Date(parseInt(sms.$.date))
            });
          } else {
            const contact = existingContacts[0];
            await db.update(contacts)
              .set({
                transactionCount: (contact.transactionCount || 0) + 1,
                totalReceived: (parseFloat(contact.totalReceived?.toString() || '0') + transactionDetails.amount).toString(),
                lastTransactionDate: new Date(parseInt(sms.$.date))
              })
              .where(eq(contacts.name, transactionDetails.sender));
          }
        }
        
        await db.update(rawSms)
          .set({ processed: 1 })
          .where(eq(rawSms.id, rawSmsId));
      } catch (error) {
        console.error(`Error processing SMS: ${error}`);
        continue; 
      }
    }
    
    console.log('SMS data import completed successfully');
    return { success: true, message: 'Import completed successfully' };
  } catch (error) {
    console.error('Error importing SMS data:', error);
    return { success: false, message: `Import failed: ${(error as Error).message}` };
  }
};

export default importSmsData; 