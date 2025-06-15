import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { mobileTransferTransactions } from '../db/schema';

/**
 * Controller for handling transfers to mobile numbers
 */
export class MobileTransferController extends BaseController {
  
  /**
   * Get all mobile transfer transactions with pagination and filtering
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
      mobileTransferTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      mobileTransferTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Recipient filter
    if (params.recipient) {
      whereConditions.push(sql`${mobileTransferTransactions.recipient} ILIKE ${`%${params.recipient}%`}`);
    }
    
    // Phone number filter
    if (params.phone) {
      whereConditions.push(sql`${mobileTransferTransactions.recipientPhone} ILIKE ${`%${params.phone}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(mobileTransferTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? mobileTransferTransactions.amount 
      : mobileTransferTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: mobileTransferTransactions.id,
        recipient: mobileTransferTransactions.recipient,
        recipientPhone: mobileTransferTransactions.recipientPhone,
        amount: mobileTransferTransactions.amount,
        transactionDate: mobileTransferTransactions.transactionDate,
        fee: mobileTransferTransactions.fee,
        balance: mobileTransferTransactions.balance,
      })
      .from(mobileTransferTransactions)
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
   * Get a specific mobile transfer transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: mobileTransferTransactions.id,
        recipient: mobileTransferTransactions.recipient,
        recipientPhone: mobileTransferTransactions.recipientPhone,
        amount: mobileTransferTransactions.amount,
        transactionDate: mobileTransferTransactions.transactionDate,
        fee: mobileTransferTransactions.fee,
        balance: mobileTransferTransactions.balance,
      })
      .from(mobileTransferTransactions)
      .where(eq(mobileTransferTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for mobile transfer transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      mobileTransferTransactions.transactionDate as any,
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
        totalAmount: sql`SUM(${mobileTransferTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${mobileTransferTransactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${mobileTransferTransactions.amount})`.mapWith(Number),
        maxAmount: sql`MAX(${mobileTransferTransactions.amount})`.mapWith(Number),
        minAmount: sql`MIN(${mobileTransferTransactions.amount})`.mapWith(Number),
        count: count(),
        uniqueRecipients: sql`COUNT(DISTINCT ${mobileTransferTransactions.recipient})`.mapWith(Number)
      })
      .from(mobileTransferTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get top recipients by transfer volume or amount
   */
  async getTopRecipients(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate, limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      mobileTransferTransactions.transactionDate as any,
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
    
    // Query for top recipients
    const topRecipients = await db
      .select({
        recipient: mobileTransferTransactions.recipient,
        phone: mobileTransferTransactions.recipientPhone,
        totalAmount: sql`SUM(${mobileTransferTransactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${mobileTransferTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${mobileTransferTransactions.fee})`.mapWith(Number)
      })
      .from(mobileTransferTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(mobileTransferTransactions.recipient, mobileTransferTransactions.recipientPhone)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${mobileTransferTransactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    return topRecipients;
  }
} 