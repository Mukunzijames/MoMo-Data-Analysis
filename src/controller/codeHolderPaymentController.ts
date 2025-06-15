import { Context } from 'hono';
import { and, count, eq, sql, or, ilike } from 'drizzle-orm';
import { BaseController, PaginatedResponse } from './baseController';
import db from '../db';
import { contacts } from '../db/schema';

/**
 * Controller for handling code holder payment transactions
 */
export class CodeHolderPaymentController extends BaseController {
  
  /**
   * Get all code holders with pagination and filtering
   */
  async getAllTransactions(c: Context): Promise<PaginatedResponse<any>> {
    const params = this.getQueryParams(c);
    const { page, limit, sortBy, sortOrder } = params;
    
    // Calculate offset for pagination
    const offset = ((page ?? 1) - 1) * (limit ?? 10);
    
    // Build filters
    let whereConditions = [];
    
    // Name filter
    if (params.name) {
      whereConditions.push(ilike(contacts.name, `%${params.name}%`));
    }
    
    // Phone filter
    if (params.phone) {
      whereConditions.push(ilike(contacts.phoneNumber, `%${params.phone}%`));
    }
    
    // Build WHERE clause
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = and(...whereConditions);
    }
    
    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(contacts)
      .where(whereClause || sql`1=1`);
    
    // Determine sort field and direction
    const sortField = sortBy === 'name' 
      ? contacts.name 
      : sortBy === 'transactionCount' 
        ? contacts.transactionCount
        : contacts.lastTransactionDate;
    
    // Get paginated results
    const codeHolders = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        phoneNumber: contacts.phoneNumber,
        transactionCount: contacts.transactionCount,
        totalSent: contacts.totalSent,
        totalReceived: contacts.totalReceived,
        lastTransactionDate: contacts.lastTransactionDate
      })
      .from(contacts)
      .where(whereClause || sql`1=1`)
      .orderBy(sortOrder === 'asc' ? sql`${sortField} ASC` : sql`${sortField} DESC`)
      .limit(limit ?? 10)
      .offset(offset);
    
    return this.formatPaginatedResponse(
      codeHolders,
      totalCount,
      page ?? 1,
      limit ?? 10
    );
  }
  
  /**
   * Get a specific code holder by ID
   */
  async getTransactionById(c: Context): Promise<any> {
    const id = c.req.param('id');
    
    if (!id) {
      throw new Error('Contact ID is required');
    }
    
    const contact = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        phoneNumber: contacts.phoneNumber,
        transactionCount: contacts.transactionCount,
        totalSent: contacts.totalSent,
        totalReceived: contacts.totalReceived,
        lastTransactionDate: contacts.lastTransactionDate
      })
      .from(contacts)
      .where(eq(contacts.id, parseInt(id)))
      .limit(1);
    
    if (contact.length === 0) {
      throw new Error('Contact not found');
    }
    
    return contact[0];
  }
  
  /**
   * Get summary statistics for code holders
   */
  async getStatistics(c: Context): Promise<any> {
    // Calculate statistics from contacts table
    const statistics = await db
      .select({
        totalContacts: count(),
        totalTransactions: sql`SUM(${contacts.transactionCount})`.mapWith(Number),
        totalSent: sql`SUM(${contacts.totalSent})`.mapWith(Number),
        totalReceived: sql`SUM(${contacts.totalReceived})`.mapWith(Number),
        averageTransactionsPerContact: sql`AVG(${contacts.transactionCount})`.mapWith(Number),
      })
      .from(contacts);
    
    return statistics[0];
  }
  
  /**
   * Get top recipients by transaction volume or amount
   */
  async getTopRecipients(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { limit = 5 } = params;
    const metric = params.metric === 'frequency' ? 'frequency' : 'amount';
    
    // Query for top recipients based on transaction count or amount received
    const topRecipients = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        phoneNumber: contacts.phoneNumber,
        frequency: contacts.transactionCount,
        totalReceived: contacts.totalReceived,
        totalSent: contacts.totalSent,
        lastTransactionDate: contacts.lastTransactionDate
      })
      .from(contacts)
      .orderBy(metric === 'frequency'
        ? sql`${contacts.transactionCount} DESC`
        : sql`${contacts.totalReceived} DESC`)
      .limit(limit ?? 5);
    
    return topRecipients;
  }
  
  /**
   * Get saved codes (frequently used contacts)
   */
  async getSavedCodes(c: Context): Promise<any[]> {
    const params = this.getQueryParams(c);
    const { limit = 10 } = params;
    
    // Query for contacts with highest transaction counts
    const savedCodes = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        phoneNumber: contacts.phoneNumber,
        transactionCount: contacts.transactionCount,
        totalSent: contacts.totalSent,
        totalReceived: contacts.totalReceived,
        lastTransactionDate: contacts.lastTransactionDate,
      })
      .from(contacts)
      .orderBy(sql`${contacts.transactionCount} DESC`)
      .limit(limit ?? 10);
    
    return savedCodes;
  }
} 