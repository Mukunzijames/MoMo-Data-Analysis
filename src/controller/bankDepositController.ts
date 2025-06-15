import { Context } from 'hono';
import { and, count, eq, sql, or, ilike } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { transactions } from '../db/schema';

/**
 * Controller for handling bank deposit transactions
 */
export class BankDepositController extends BaseController {
  
  /**
   * Get all bank deposit transactions with pagination and filtering
   */
  async getAllTransactions(c: Context): Promise<PaginatedResponse<any>> {
    const params = this.getQueryParams(c);
    const { page, limit, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = params;
    
    // Calculate offset for pagination
    const offset = ((page ?? 1) - 1) * (limit ?? 10);
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for deposit-related transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%DEPOSIT%'),
        ilike(transactions.description, '%DEPOSIT%'),
        ilike(transactions.description, '%BANK%'),
        ilike(transactions.category, '%DEPOSIT%'),
        ilike(transactions.category, '%BANK%')
      )
    );
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      transactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      transactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Bank filter
    if (params.bank) {
      whereConditions.push(sql`${transactions.description} ILIKE ${`%${params.bank}%`}`);
    }
    
    // Account number filter
    if (params.accountNumber) {
      whereConditions.push(sql`${transactions.accountNumber} ILIKE ${`%${params.accountNumber}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(transactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? transactions.amount 
      : transactions.transactionDate;
    
    // Get paginated results
    const bankDeposits = await db
      .select({
        id: transactions.id,
        transactionId: transactions.transactionId,
        transactionType: transactions.transactionType,
        accountNumber: transactions.accountNumber,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,
        fee: transactions.fee,
        balance: transactions.balanceAfter,
        description: transactions.description,
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit ?? 10)
      .offset(offset);
    
    return this.formatPaginatedResponse(
      bankDeposits,
      totalCount,
      page ?? 1,
      limit ?? 10
    );
  }
  
  /**
   * Get a specific bank deposit transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: transactions.id,
        transactionId: transactions.transactionId,
        transactionType: transactions.transactionType,
        accountNumber: transactions.accountNumber,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,
        fee: transactions.fee,
        balance: transactions.balanceAfter,
        description: transactions.description,
      })
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for bank deposit transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for deposit-related transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%DEPOSIT%'),
        ilike(transactions.description, '%DEPOSIT%'),
        ilike(transactions.description, '%BANK%'),
        ilike(transactions.category, '%DEPOSIT%'),
        ilike(transactions.category, '%BANK%')
      )
    );
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      transactions.transactionDate as any,
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
        totalAmount: sql`SUM(${transactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${transactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${transactions.amount})`.mapWith(Number),
        count: count(),
        uniqueAccounts: sql`COUNT(DISTINCT ${transactions.accountNumber})`.mapWith(Number),
      })
      .from(transactions)
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
    
    // Transaction type filter - look for deposit-related transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%DEPOSIT%'),
        ilike(transactions.description, '%DEPOSIT%'),
        ilike(transactions.description, '%BANK%'),
        ilike(transactions.category, '%DEPOSIT%'),
        ilike(transactions.category, '%BANK%')
      )
    );
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      transactions.transactionDate as any,
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
    
    // Extract bank name from description field (assuming it contains bank name)
    // Query for top banks
    const topBanks = await db
      .select({
        bankName: sql`REGEXP_MATCHES(${transactions.description}, '([A-Za-z]+ Bank|[A-Za-z]+ BANK|BANK OF [A-Za-z]+)')`.mapWith(Array),
        totalAmount: sql`SUM(${transactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${transactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${transactions.fee})`.mapWith(Number)
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .groupBy(sql`REGEXP_MATCHES(${transactions.description}, '([A-Za-z]+ Bank|[A-Za-z]+ BANK|BANK OF [A-Za-z]+)')`)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${transactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    // Format the bank names
    return topBanks.map(bank => ({
      ...bank,
      bankName: bank.bankName ? bank.bankName[0] : 'Unknown Bank'
    }));
  }
  
  /**
   * Get deposit trends (by month)
   */
  async getTrends(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for deposit-related transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%DEPOSIT%'),
        ilike(transactions.description, '%DEPOSIT%'),
        ilike(transactions.description, '%BANK%'),
        ilike(transactions.category, '%DEPOSIT%'),
        ilike(transactions.category, '%BANK%')
      )
    );
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      transactions.transactionDate as any,
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
    
    // Group by month and get trend data
    const trends = await db
      .select({
        month: sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`.mapWith(String),
        totalAmount: sql`SUM(${transactions.amount})`.mapWith(Number),
        count: count(),
        averageAmount: sql`AVG(${transactions.amount})`.mapWith(Number)
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .groupBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`);
    
    return trends;
  }
} 