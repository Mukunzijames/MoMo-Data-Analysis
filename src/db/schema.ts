import { 
  integer, 
  pgTable, 
  varchar, 
  timestamp, 
  text, 
  decimal, 
  serial, 
  uniqueIndex, 
  index ,
  uuid,
  boolean,
  date
} from "drizzle-orm/pg-core";

// mobile money transactions table 
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 20 }),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 5 }).default("RWF"),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  sender: varchar("sender", { length: 100 }),
  recipient: varchar("recipient", { length: 100 }),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  transactionDate: timestamp("transaction_date").notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  externalId: varchar("external_id", { length: 100 }),
  accountNumber: varchar("account_number", { length: 20 }),
  rawSms: text("raw_sms")
}, (table) => {
  return {
    transactionDateIdx: index("idx_transactions_date").on(table.transactionDate),
    transactionTypeIdx: index("idx_transactions_type").on(table.transactionType),
    transactionIdIdx: index("idx_transactions_transaction_id").on(table.transactionId)
  };
});

// Contacts table to store unique contacts from transactions
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  transactionCount: integer("transaction_count").default(0),
  totalSent: decimal("total_sent", { precision: 10, scale: 2 }).default("0"),
  totalReceived: decimal("total_received", { precision: 10, scale: 2 }).default("0"),
  lastTransactionDate: timestamp("last_transaction_date")
}, (table) => {
  return {
    phoneNumberIdx: uniqueIndex("idx_contacts_phone").on(table.phoneNumber),
    nameIdx: index("idx_contacts_name").on(table.name)
  };
});

// Categories table for transaction categorization
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description")
}, (table) => {
  return {
    nameIdx: uniqueIndex("idx_categories_name").on(table.name)
  };
});

// Raw SMS table to store the original SMS data
export const rawSms = pgTable("raw_sms", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 50 }),
  date: timestamp("date").notNull(),
  type: integer("type"),
  body: text("body").notNull(),
  serviceCenter: varchar("service_center", { length: 50 }),
  readStatus: integer("read_status"),
  dateSent: timestamp("date_sent"),
  contactName: varchar("contact_name", { length: 100 }),
  processed: integer("processed").default(0)
}, (table) => {
  return {
    dateIdx: index("idx_raw_sms_date").on(table.date)
  };
});

// customers table 
export const customersTable = pgTable("customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ======================== New Schema Tables for SMS Categorization ========================

// MoMo Transaction Types from JSON
export const momoTransactionTypes = pgTable("momo_transaction_types", {
  id: serial("id").primaryKey(),
  categoryKey: varchar("category_key", { length: 50 }).notNull().unique(), // The internal key (e.g., "incoming_money")
  displayName: varchar("display_name", { length: 100 }).notNull(), // User-friendly name for UI
  description: text("description"),
  iconClass: varchar("icon_class", { length: 50 }), // For UI representation
}, (table) => {
  return {
    categoryKeyIdx: uniqueIndex("idx_momo_transaction_types_key").on(table.categoryKey)
  };
});

// Main SMS processed transactions table
export const momoTransactions = pgTable("momo_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 50 }).notNull(), // References momoTransactionTypes.categoryKey
  transactionDate: timestamp("transaction_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  recipient: varchar("recipient", { length: 100 }),
  transactionId: varchar("transaction_id", { length: 50 }),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  rawSmsId: integer("raw_sms_id").references(() => rawMomoSms.id),
  readableDate: varchar("readable_date", { length: 50 }),
  processed: boolean("processed").default(true),
}, (table) => {
  return {
    categoryIdx: index("idx_momo_transactions_category").on(table.category),
    transactionDateIdx: index("idx_momo_transactions_date").on(table.transactionDate),
    transactionIdIdx: index("idx_momo_transactions_transaction_id").on(table.transactionId)
  };
});

// Raw Mobile Money SMS storage
export const rawMomoSms = pgTable("raw_momo_sms", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  readableDate: varchar("readable_date", { length: 50 }),
  body: text("body").notNull(),
  processed: boolean("processed").default(false),
  importBatch: varchar("import_batch", { length: 50 }),
  importDate: timestamp("import_date").defaultNow()
}, (table) => {
  return {
    dateIdx: index("idx_raw_momo_sms_date").on(table.date),
    processedIdx: index("idx_raw_momo_sms_processed").on(table.processed)
  };
});

// Incoming Money Transactions
export const incomingMoneyTransactions = pgTable("incoming_money_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 50 }),
  sender: varchar("sender", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_incoming_money_date").on(table.transactionDate),
    senderIdx: index("idx_incoming_money_sender").on(table.sender)
  };
});

// Cash Power Payments
export const cashPowerTransactions = pgTable("cash_power_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 50 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  token: varchar("token", { length: 100 }),
  transactionDate: timestamp("transaction_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_cash_power_date").on(table.transactionDate),
    tokenIdx: index("idx_cash_power_token").on(table.token)
  };
});

// Third Party Transactions
export const thirdPartyTransactions = pgTable("third_party_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 50 }),
  vendor: varchar("vendor", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  externalId: varchar("external_id", { length: 100 }),
  transactionDate: timestamp("transaction_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_third_party_date").on(table.transactionDate),
    vendorIdx: index("idx_third_party_vendor").on(table.vendor)
  };
});

// Agent Withdrawals
export const withdrawalTransactions = pgTable("withdrawal_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 50 }),
  agentName: varchar("agent_name", { length: 100 }),
  agentPhone: varchar("agent_phone", { length: 20 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_withdrawal_date").on(table.transactionDate),
    agentNameIdx: index("idx_withdrawal_agent").on(table.agentName)
  };
});

// Mobile Number Transfer Transactions
export const mobileTransferTransactions = pgTable("mobile_transfer_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipient: varchar("recipient", { length: 100 }).notNull(),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_mobile_transfer_date").on(table.transactionDate),
    recipientIdx: index("idx_mobile_transfer_recipient").on(table.recipient)
  };
});

// Internet and Voice Bundle Transactions
export const bundleTransactions = pgTable("bundle_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 50 }),
  bundleType: varchar("bundle_type", { length: 50 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dataAmount: varchar("data_amount", { length: 50 }),
  validityDays: integer("validity_days"),
  transactionDate: timestamp("transaction_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_bundle_date").on(table.transactionDate),
    bundleTypeIdx: index("idx_bundle_type").on(table.bundleType)
  };
});

// Bank Deposit and Transfer Transactions
export const bankTransactions = pgTable("bank_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: varchar("transaction_id", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  accountNumber: varchar("account_number", { length: 50 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // "deposit" or "withdrawal"
  transactionDate: timestamp("transaction_date").notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }),
  mainTransactionId: uuid("main_transaction_id").references(() => momoTransactions.id)
}, (table) => {
  return {
    transactionDateIdx: index("idx_bank_transaction_date").on(table.transactionDate),
    transactionTypeIdx: index("idx_bank_transaction_type").on(table.transactionType)
  };
});

// Summary statistics for each transaction category
export const momoStatistics = pgTable("momo_statistics", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  count: integer("count").default(0),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).default("0"),
  averageAmount: decimal("average_amount", { precision: 10, scale: 2 }).default("0"),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow()
}, (table) => {
  return {
    categoryIdx: uniqueIndex("idx_momo_statistics_category").on(table.category)
  };
});
