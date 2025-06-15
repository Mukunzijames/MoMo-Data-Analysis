import db from '../db';
import { momoTransactionTypes } from '../db/schema';

// Categories defined in the sms-processor.js
const CATEGORIES = [
  {
    categoryKey: 'incoming_money',
    displayName: 'Incoming Money',
    description: 'Money received from other mobile money users',
    iconClass: 'fas fa-arrow-down'
  },
  {
    categoryKey: 'payment_to_code',
    displayName: 'Payment to Code Holders',
    description: 'Payments made to merchants or individuals using a code',
    iconClass: 'fas fa-code'
  },
  {
    categoryKey: 'transfer_to_mobile',
    displayName: 'Transfers to Mobile Numbers',
    description: 'Money sent to other mobile money users',
    iconClass: 'fas fa-mobile-alt'
  },
  {
    categoryKey: 'bank_deposit',
    displayName: 'Bank Deposits',
    description: 'Money received from bank accounts',
    iconClass: 'fas fa-university'
  },
  {
    categoryKey: 'airtime_payment',
    displayName: 'Airtime Bill Payments',
    description: 'Airtime purchases for mobile phones',
    iconClass: 'fas fa-phone'
  },
  {
    categoryKey: 'cash_power_payment',
    displayName: 'Cash Power Bill Payments',
    description: 'Electricity meter token purchases',
    iconClass: 'fas fa-bolt'
  },
  {
    categoryKey: 'third_party_transaction',
    displayName: 'Third Party Transactions',
    description: 'Payments made to external services and companies',
    iconClass: 'fas fa-handshake'
  },
  {
    categoryKey: 'withdrawal_from_agent',
    displayName: 'Withdrawals from Agents',
    description: 'Cash withdrawals from mobile money agents',
    iconClass: 'fas fa-user-tie'
  },
  {
    categoryKey: 'internet_bundle_purchase',
    displayName: 'Internet & Voice Bundles',
    description: 'Internet data and voice bundle purchases',
    iconClass: 'fas fa-wifi'
  },
  {
    categoryKey: 'other',
    displayName: 'Other Transactions',
    description: 'Miscellaneous or uncategorized transactions',
    iconClass: 'fas fa-ellipsis-h'
  }
];

async function seedMomoCategories() {
  console.log('Starting to seed MoMo transaction categories...');
  
  try {
    // Check if categories already exist
    for (const category of CATEGORIES) {
      // Insert each category
      await db.insert(momoTransactionTypes).values(category).onConflictDoUpdate({
        target: momoTransactionTypes.categoryKey,
        set: {
          displayName: category.displayName,
          description: category.description,
          iconClass: category.iconClass
        }
      });
      
      console.log(`Seeded or updated category: ${category.displayName}`);
    }
    
    console.log('MoMo transaction categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding MoMo transaction categories:', error);
  }
}

// Run seed function if this script is executed directly
if (require.main === module) {
  seedMomoCategories()
    .then(() => {
      console.log('Seeding completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedMomoCategories; 