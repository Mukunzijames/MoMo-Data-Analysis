import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { incomingMoneyTransactions, momoTransactions } from '../db/schema';

/**
 * Controller for handling incoming money transactions
 */
export class IncomingMoneyController extends BaseController {
  
  /**
   * Get all incoming money transactions with pagination and filtering
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
      incomingMoneyTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      incomingMoneyTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Specific sender filter
    if (params.sender) {
      whereConditions.push(sql`${incomingMoneyTransactions.sender} ILIKE ${`%${params.sender}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(incomingMoneyTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? incomingMoneyTransactions.amount 
      : incomingMoneyTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: incomingMoneyTransactions.id,
        transactionId: incomingMoneyTransactions.transactionId,
        sender: incomingMoneyTransactions.sender,
        amount: incomingMoneyTransactions.amount,
        transactionDate: incomingMoneyTransactions.transactionDate,
        balance: incomingMoneyTransactions.balance,
        // Explicitly exclude raw SMS message
      })
      .from(incomingMoneyTransactions)
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
   * Get a specific incoming money transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: incomingMoneyTransactions.id,
        transactionId: incomingMoneyTransactions.transactionId,
        sender: incomingMoneyTransactions.sender,
        amount: incomingMoneyTransactions.amount,
        transactionDate: incomingMoneyTransactions.transactionDate,
        balance: incomingMoneyTransactions.balance,
        // Explicitly exclude raw SMS message
      })
      .from(incomingMoneyTransactions)
      .where(eq(incomingMoneyTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for incoming money transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      incomingMoneyTransactions.transactionDate as any,
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
        totalAmount: sql`SUM(${incomingMoneyTransactions.amount})`.mapWith(Number),
        averageAmount: sql`AVG(${incomingMoneyTransactions.amount})`.mapWith(Number),
        maxAmount: sql`MAX(${incomingMoneyTransactions.amount})`.mapWith(Number),
        minAmount: sql`MIN(${incomingMoneyTransactions.amount})`.mapWith(Number),
        count: count(),
        uniqueSenders: sql`COUNT(DISTINCT ${incomingMoneyTransactions.sender})`.mapWith(Number),
      })
      .from(incomingMoneyTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get top senders by total amount or frequency
   */
  async getTopSenders(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate, limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      incomingMoneyTransactions.transactionDate as any,
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
    
    // Query for top senders
    const topSenders = await db
      .select({
        sender: incomingMoneyTransactions.sender,
        totalAmount: sql`SUM(${incomingMoneyTransactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${incomingMoneyTransactions.amount})`.mapWith(Number)
      })
      .from(incomingMoneyTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(incomingMoneyTransactions.sender)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${incomingMoneyTransactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    return topSenders;
  }
} 