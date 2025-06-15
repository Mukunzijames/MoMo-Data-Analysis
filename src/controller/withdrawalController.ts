import { Context } from 'hono';
import { and, count, eq, sql } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { withdrawalTransactions } from '../db/schema';

/**
 * Controller for handling withdrawals from agents
 */
export class WithdrawalController extends BaseController {
  
  /**
   * Get all withdrawal transactions with pagination and filtering
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
      withdrawalTransactions.transactionDate as any,
      startDate,
      endDate
    );
    if (dateFilter) {
      whereConditions.push(dateFilter);
    }
    
    // Amount range filter
    const amountFilter = this.getAmountRangeFilter(
      withdrawalTransactions.amount as any,
      minAmount,
      maxAmount
    );
    if (amountFilter) {
      whereConditions.push(amountFilter);
    }
    
    // Agent filter
    if (params.agent) {
      whereConditions.push(sql`${withdrawalTransactions.agentName} ILIKE ${`%${params.agent}%`}`);
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(withdrawalTransactions)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'amount' 
      ? withdrawalTransactions.amount 
      : withdrawalTransactions.transactionDate;
    
    // Get paginated results
    const transactions = await db
      .select({
        id: withdrawalTransactions.id,
        transactionId: withdrawalTransactions.transactionId,
        agentName: withdrawalTransactions.agentName,
        agentPhone: withdrawalTransactions.agentPhone,
        amount: withdrawalTransactions.amount,
        transactionDate: withdrawalTransactions.transactionDate,
        fee: withdrawalTransactions.fee,
        balance: withdrawalTransactions.balance,
      })
      .from(withdrawalTransactions)
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
   * Get a specific withdrawal transaction by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Transaction ID is required');
    }
    
    const transaction = await db
      .select({
        id: withdrawalTransactions.id,
        transactionId: withdrawalTransactions.transactionId,
        agentName: withdrawalTransactions.agentName,
        agentPhone: withdrawalTransactions.agentPhone,
        amount: withdrawalTransactions.amount,
        transactionDate: withdrawalTransactions.transactionDate,
        fee: withdrawalTransactions.fee,
        balance: withdrawalTransactions.balance,
      })
      .from(withdrawalTransactions)
      .where(eq(withdrawalTransactions.id, id))
      .limit(1);
    
    if (transaction.length === 0) {
      throw new Error('Transaction not found');
    }
    
    return transaction[0];
  }
  
  /**
   * Get summary statistics for withdrawal transactions
   */
  async getStatistics(c: Context): Promise<any> {
    const params = this.getQueryParams(c);
    const { startDate, endDate } = params;
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      withdrawalTransactions.transactionDate as any,
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
        totalAmount: sql`SUM(${withdrawalTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${withdrawalTransactions.fee})`.mapWith(Number),
        averageAmount: sql`AVG(${withdrawalTransactions.amount})`.mapWith(Number),
        maxAmount: sql`MAX(${withdrawalTransactions.amount})`.mapWith(Number),
        minAmount: sql`MIN(${withdrawalTransactions.amount})`.mapWith(Number),
        count: count(),
        uniqueAgents: sql`COUNT(DISTINCT ${withdrawalTransactions.agentName})`.mapWith(Number)
      })
      .from(withdrawalTransactions)
      .where(whereClause || sql`1=1`);
    
    return statistics[0];
  }
  
  /**
   * Get top agents by withdrawal volume or amount
   */
  async getTopAgents(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { startDate, endDate, limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Build filters
    let whereConditions = [];
    
    // Date range filter
    const dateFilter = this.getDateRangeFilter(
      withdrawalTransactions.transactionDate as any,
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
    
    // Query for top agents
    const topAgents = await db
      .select({
        agent: withdrawalTransactions.agentName,
        phone: withdrawalTransactions.agentPhone,
        totalAmount: sql`SUM(${withdrawalTransactions.amount})`.mapWith(Number),
        frequency: count(),
        averageAmount: sql`AVG(${withdrawalTransactions.amount})`.mapWith(Number),
        totalFees: sql`SUM(${withdrawalTransactions.fee})`.mapWith(Number)
      })
      .from(withdrawalTransactions)
      .where(whereClause || sql`1=1`)
      .groupBy(withdrawalTransactions.agentName, withdrawalTransactions.agentPhone)
      .orderBy(metric === 'frequency'
        ? sql`COUNT(*) DESC`
        : sql`SUM(${withdrawalTransactions.amount}) DESC`)
      .limit(limit ?? 5);
    
    return topAgents;
  }
} 