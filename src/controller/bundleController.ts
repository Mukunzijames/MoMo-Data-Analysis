import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { bundleTransactions } from '../db/schema';

/**
 * Controller for handling internet and voice bundle purchases
 */
export class BundleController extends BaseController {
  
  /**
   * Get all bundle purchase transactions with pagination and filtering
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
      bundleTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      bundleTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Provider filter
    if (params.provider) {
      whereConditions.push(sql`${bundleTransactions.mainTransactionId} ILIKE ${`%${params.mainTransactionId}%`}`);
    }
    
    // Bundle type filter
    if (params.bundleType) {
      whereConditions.push(sql`${bundleTransactions.bundleType} ILIKE ${`%${params.bundleType}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(bundleTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? bundleTransactions.amount 
      : bundleTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: bundleTransactions.id,
        transactionId: bundleTransactions.transactionId,
        provider: bundleTransactions.mainTransactionId,
        bundleType: bundleTransactions.bundleType,
        amount: bundleTransactions.amount,
        transactionDate: bundleTransactions.transactionDate,
        phoneNumber: bundleTransactions.dataAmount,
        fee: bundleTransactions.fee,
        balance: bundleTransactions.balance,
      })
      .from(bundleTransactions)
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
   * Get a specific bundle purchase transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: bundleTransactions.id,
        transactionId: bundleTransactions.transactionId,
        amount: bundleTransactions.amount,
        transactionDate: bundleTransactions.transactionDate,
        phoneNumber: bundleTransactions.dataAmount  ,
        fee: bundleTransactions.fee,
        balance: bundleTransactions.balance,
      })
      .from(bundleTransactions)
      .where(eq(bundleTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for bundle purchase transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      bundleTransactions.transactionDate as any,
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
        totalAmount: sql`SUM(${bundleTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${bundleTransactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${bundleTransactions.amount})`.mapWith(Number),
        count: count(),
        uniqueProviders: sql`COUNT(DISTINCT ${bundleTransactions.mainTransactionId})`.mapWith(Number),
        uniquePhoneNumbers: sql`COUNT(DISTINCT ${bundleTransactions.dataAmount})`.mapWith(Number)
      })
      .from(bundleTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get bundle purchase breakdown by provider and type
   */
  async getBundleBreakdown(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      bundleTransactions.transactionDate as any,
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
    
    // Query for bundle breakdown
    const bundleBreakdown = await db
      .select({
        provider: bundleTransactions.mainTransactionId,
        bundleType: bundleTransactions.bundleType,
        totalAmount: sql`SUM(${bundleTransactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${bundleTransactions.amount})`.mapWith(Number)
      })
      .from(bundleTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(bundleTransactions.mainTransactionId, bundleTransactions.bundleType)
      .orderBy(sql`SUM(${bundleTransactions.amount}) DESC`);
    
    return bundleBreakdown;
  }
  
  /**
   * Get frequently used phone numbers for bundle purchases
   */
  async getFrequentNumbers(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { limit = 10 } = params;
    
    // Query for frequently used phone numbers
    const frequentNumbers = await db
      .select({
        phoneNumber: bundleTransactions.dataAmount,
        frequency: count(),
        totalAmount: sql`SUM(${bundleTransactions.amount})`.mapWith(Number),
        lastPurchased: sql`MAX(${bundleTransactions.transactionDate})`.mapWith(Date),
        commonProvider: sql`MODE() WITHIN GROUP (ORDER BY ${bundleTransactions.mainTransactionId})`,
        commonBundleType: sql`MODE() WITHIN GROUP (ORDER BY ${bundleTransactions.bundleType})`
      })
      .from(bundleTransactions)
        .groupBy(bundleTransactions.dataAmount)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit ?? 10);
    
    return frequentNumbers;
  }
} 