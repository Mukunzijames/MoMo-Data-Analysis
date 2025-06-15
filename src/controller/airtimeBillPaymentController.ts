import { Context } from 'hono';
import { and, count, eq, sql, or, ilike } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { transactions } from '../db/schema';

/**
 * Controller for handling airtime and bill payment transactions
 */
export class AirtimeBillPaymentController extends BaseController {
  
  /**
   * Get all airtime and bill payment transactions with pagination and filtering
   */
  async getAllTransactions(c: Context): Promise<PaginatedResponse<any>> {
    const params = this.getQueryParams(c);
    const { page, limit, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = params;
    
    // Calculate offset for pagination
    const offset = ((page ?? 1) - 1) * (limit ?? 10);
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for airtime and bill payment transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%PAYMENT%'),
        ilike(transactions.transactionType, '%AIRTIME%'),
        ilike(transactions.transactionType, '%BILL%'),
        ilike(transactions.description, '%AIRTIME%'),
        ilike(transactions.description, '%BILL%'),
        ilike(transactions.category, '%AIRTIME%'),
        ilike(transactions.category, '%BILL%'),
        ilike(transactions.category, '%PAYMENT%')
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
    
    // Provider filter
    if (params.provider) {
      whereConditions.push(sql`${transactions.recipient} ILIKE ${`%${params.provider}%`}`);
    }
    
    // Category filter
    if (params.category) {
      whereConditions.push(sql`${transactions.category} ILIKE ${`%${params.category}%`}`);
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
    const payments = await db
      .select({
        id: transactions.id,
        transactionId: transactions.transactionId,
        transactionType: transactions.transactionType,
        recipient: transactions.recipient,
        amount: transactions.amount,
        category: transactions.category,
        transactionDate: transactions.transactionDate,
        fee: transactions.fee,
        balance: transactions.balanceAfter,
        description: transactions.description,
        externalId: transactions.externalId,
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit ?? 10)
      .offset(offset);
    
    return this.formatPaginatedResponse(
      payments,
      totalCount,
      page ?? 1,
      limit ?? 10
    );
  }
  
  /**
   * Get a specific airtime or bill payment transaction by ID
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
        recipient: transactions.recipient,
        amount: transactions.amount,
        category: transactions.category,
        transactionDate: transactions.transactionDate,
        fee: transactions.fee,
        balance: transactions.balanceAfter,
        description: transactions.description,
        externalId: transactions.externalId,
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
   * Get summary statistics for airtime and bill payment transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for airtime and bill payment transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%PAYMENT%'),
        ilike(transactions.transactionType, '%AIRTIME%'),
        ilike(transactions.transactionType, '%BILL%'),
        ilike(transactions.description, '%AIRTIME%'),
        ilike(transactions.description, '%BILL%'),
        ilike(transactions.category, '%AIRTIME%'),
        ilike(transactions.category, '%BILL%'),
        ilike(transactions.category, '%PAYMENT%')
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
        uniqueProviders: sql`COUNT(DISTINCT ${transactions.recipient})`.mapWith(Number),
      })
      .from(transactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get top service providers by transaction volume or amount
   */
  async getTopProviders(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate, limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for airtime and bill payment transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%PAYMENT%'),
        ilike(transactions.transactionType, '%AIRTIME%'),
        ilike(transactions.transactionType, '%BILL%'),
        ilike(transactions.description, '%AIRTIME%'),
        ilike(transactions.description, '%BILL%'),
        ilike(transactions.category, '%AIRTIME%'),
        ilike(transactions.category, '%BILL%'),
        ilike(transactions.category, '%PAYMENT%')
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
    
    // Query for top service providers
    const topProviders = await db
      .select({
        provider: transactions.recipient,
        totalAmount: sql`SUM(${transactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${transactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${transactions.fee})`.mapWith(Number)
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .groupBy(transactions.recipient)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${transactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    return topProviders;
  }
  
  /**
   * Get bill payment types/categories
   */
  async getBillTypes(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { limit = 20 } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Transaction type filter - look for airtime and bill payment transactions
    whereConditions.push(
      or(
        ilike(transactions.transactionType, '%PAYMENT%'),
        ilike(transactions.transactionType, '%AIRTIME%'),
        ilike(transactions.transactionType, '%BILL%'),
        ilike(transactions.description, '%AIRTIME%'),
        ilike(transactions.description, '%BILL%'),
        ilike(transactions.category, '%AIRTIME%'),
        ilike(transactions.category, '%BILL%'),
        ilike(transactions.category, '%PAYMENT%')
      )
    );
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Query for payment categories
    const billTypes = await db
      .select({
        category: transactions.category,
        totalAmount: sql`SUM(${transactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${transactions.amount})`.mapWith(Number),
      })
      .from(transactions)
      .where(whereClause || sql`1=1`)
      .groupBy(transactions.category)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit ?? 20);
    
    return billTypes;
  }
} 