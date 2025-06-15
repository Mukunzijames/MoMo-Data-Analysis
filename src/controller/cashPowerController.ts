import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { cashPowerTransactions } from '../db/schema';

/**
 * Controller for handling cash power bill payment transactions
 */
export class CashPowerController extends BaseController {
  
  /**
   * Get all cash power transactions with pagination and filtering
   */
  async getAllTransactions(c: Context): Promise<PaginatedResponse<any>> {
    const params = this.getQueryParams(c);
    const { page, limit, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = params;
    // Calculate offset for pagination
    const offset = ((page ?? 1) - 1) * (limit ?? 10);
    
    // Build filters
    const whereConditions = [];
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      cashPowerTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      cashPowerTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Token filter
    if (params.token) {
      whereConditions.push(sql`${cashPowerTransactions.token} ILIKE ${`%${params.token}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(cashPowerTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? cashPowerTransactions.amount 
      : cashPowerTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: cashPowerTransactions.id,
        transactionId: cashPowerTransactions.transactionId,
        token: cashPowerTransactions.token,
        amount: cashPowerTransactions.amount,
        transactionDate: cashPowerTransactions.transactionDate,
        fee: cashPowerTransactions.fee,
        balance: cashPowerTransactions.balance,
      })
      .from(cashPowerTransactions)
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
   * Get a specific cash power transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: cashPowerTransactions.id,
        transactionId: cashPowerTransactions.transactionId,
        token: cashPowerTransactions.token,
        amount: cashPowerTransactions.amount,
        transactionDate: cashPowerTransactions.transactionDate,
        fee: cashPowerTransactions.fee,
        balance: cashPowerTransactions.balance,
      })
      .from(cashPowerTransactions)
      .where(eq(cashPowerTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for cash power transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      cashPowerTransactions.transactionDate as any,
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
        totalAmount: sql`SUM(${cashPowerTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${cashPowerTransactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${cashPowerTransactions.amount})`.mapWith(Number),
        maxAmount: sql`MAX(${cashPowerTransactions.amount})`.mapWith(Number),
        minAmount: sql`MIN(${cashPowerTransactions.amount})`.mapWith(Number),
        count: count(),
      })
      .from(cashPowerTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get monthly cash power purchase trends
   */
  async getMonthlyTrends(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      cashPowerTransactions.transactionDate as any,
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
    
    // Query for monthly trends
    const monthlyTrends = await db
      .select({
        month: sql`TO_CHAR(${cashPowerTransactions.transactionDate}, 'YYYY-MM')`.as('month'),
        totalAmount: sql`SUM(${cashPowerTransactions.amount})`.mapWith(Number),
        transactionCount: count(),
        averageAmount: sql`AVG(${cashPowerTransactions.amount})`.mapWith(Number)
      })
      .from(cashPowerTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(sql`TO_CHAR(${cashPowerTransactions.transactionDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${cashPowerTransactions.transactionDate}, 'YYYY-MM')`);
    
    return monthlyTrends;
  }
}