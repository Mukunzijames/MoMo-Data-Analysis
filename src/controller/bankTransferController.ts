import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { bankTransactions } from '../db/schema';

/**
 * Controller for handling bank transfer transactions
 */
export class BankTransferController extends BaseController {
  
  /**
   * Get all bank transfer transactions with pagination and filtering
   */
  async getAllTransactions(c: Context): Promise<PaginatedResponse<any>> {
    const params = this.getQueryParams(c);
    const { page, limit, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = params;
    
    // Calculate offset for pagination
    const offset = ((page ?? 1) - 1) * (limit ?? 10);
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      bankTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      bankTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Bank name filter
    if (params.bank) {
      whereConditions.push(sql`${bankTransactions.bankName} ILIKE ${`%${params.bank}%`}`);
    }
    
    // Account number filter
    if (params.accountNumber) {
      whereConditions.push(sql`${bankTransactions.accountNumber} ILIKE ${`%${params.accountNumber}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(bankTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? bankTransactions.amount 
      : bankTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: bankTransactions.id,
        transactionId: bankTransactions.transactionId,
        bankName: bankTransactions.bankName,
        accountName: bankTransactions.accountNumber,
        accountNumber: bankTransactions.accountNumber,
        amount: bankTransactions.amount,
        transactionDate: bankTransactions.transactionDate,
        fee: bankTransactions.fee,
        balance: bankTransactions.balance,
      })
      .from(bankTransactions)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit ?? 10)
      .offset(offset);
    
    return this.formatPaginatedResponse(
      transactions,
      totalCount,
      page ?? 1,
      limit ?? 10
    );
  }
  
  /**
   * Get a specific bank transfer transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: bankTransactions.id,
        transactionId: bankTransactions.transactionId,
        bankName: bankTransactions.bankName,
        accountName: bankTransactions.accountNumber,
        accountNumber: bankTransactions.accountNumber,
        amount: bankTransactions.amount,
        transactionDate: bankTransactions.transactionDate,
        fee: bankTransactions.fee,
        balance: bankTransactions.balance,
      })
      .from(bankTransactions)
      .where(eq(bankTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for bank transfer transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      bankTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Calculate statistics
    const statistics = await db
      .select({
        totalAmount: sql`SUM(${bankTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${bankTransactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${bankTransactions.amount})`.mapWith(Number),
        count: count(),
        uniqueBanks: sql`COUNT(DISTINCT ${bankTransactions.bankName})`.mapWith(Number),
      })
      .from(bankTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get top banks by transaction volume or amount
   */
  async getTopBanks(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate, limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      bankTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Query for top banks
    const topBanks = await db
      .select({
        bankName: bankTransactions.bankName,
        totalAmount: sql`SUM(${bankTransactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${bankTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${bankTransactions.fee})`.mapWith(Number)
      })
      .from(bankTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(bankTransactions.bankName)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${bankTransactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    return topBanks;
  }
  
  /**
   * Get saved bank accounts (frequently used)
   */
  async getSavedAccounts(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { limit = 10 } = params;
    
    // Query for frequently used accounts
    const savedAccounts = await db
      .select({
        bankName: bankTransactions.bankName,
        accountName: bankTransactions.accountNumber,
        accountNumber: bankTransactions.accountNumber,
        frequency: count(),
        totalAmount: sql`SUM(${bankTransactions.amount})`.mapWith(Number),
        lastUsed: sql`MAX(${bankTransactions.transactionDate})`.mapWith(Date),
      })
      .from(bankTransactions)
      .groupBy(bankTransactions.bankName, bankTransactions.accountNumber)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit ?? 10);
    
    return savedAccounts;
  }
} 