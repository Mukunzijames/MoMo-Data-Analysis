import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { thirdPartyTransactions } from '../db/schema';

/**
 * Controller for handling third party transactions
 */
export class ThirdPartyController extends BaseController {
  
  /**
   * Get all third party transactions with pagination and filtering
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
      thirdPartyTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      thirdPartyTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Vendor filter
    if (params.vendor) {
      whereConditions.push(sql`${thirdPartyTransactions.vendor} ILIKE ${`%${params.vendor}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(thirdPartyTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? thirdPartyTransactions.amount 
      : thirdPartyTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: thirdPartyTransactions.id,
        transactionId: thirdPartyTransactions.transactionId,
        vendor: thirdPartyTransactions.vendor,
        amount: thirdPartyTransactions.amount,
        transactionDate: thirdPartyTransactions.transactionDate,
        externalId: thirdPartyTransactions.externalId,
        fee: thirdPartyTransactions.fee,
        balance: thirdPartyTransactions.balance,
      })
      .from(thirdPartyTransactions)
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
   * Get a specific third party transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: thirdPartyTransactions.id,
        transactionId: thirdPartyTransactions.transactionId,
        vendor: thirdPartyTransactions.vendor,
        amount: thirdPartyTransactions.amount,
        transactionDate: thirdPartyTransactions.transactionDate,
        externalId: thirdPartyTransactions.externalId,
        fee: thirdPartyTransactions.fee,
        balance: thirdPartyTransactions.balance,
      })
      .from(thirdPartyTransactions)
      .where(eq(thirdPartyTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for third party transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      thirdPartyTransactions.transactionDate as any,
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
        totalAmount: sql`SUM(${thirdPartyTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${thirdPartyTransactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${thirdPartyTransactions.amount})`.mapWith(Number),
        count: count(),
        uniqueVendors: sql`COUNT(DISTINCT ${thirdPartyTransactions.vendor})`.mapWith(Number)
      })
      .from(thirdPartyTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get top vendors by transaction volume or amount
   */
  async getTopVendors(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate, limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      thirdPartyTransactions.transactionDate as any,
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
    
    // Query for top vendors
    const topVendors = await db
      .select({
        vendor: thirdPartyTransactions.vendor,
        totalAmount: sql`SUM(${thirdPartyTransactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${thirdPartyTransactions.amount})`.mapWith(Number)
      })
      .from(thirdPartyTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(thirdPartyTransactions.vendor)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${thirdPartyTransactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    return topVendors;
  }
} 