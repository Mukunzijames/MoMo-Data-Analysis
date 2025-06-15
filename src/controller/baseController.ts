import { Context } from 'hono';
import { SQL, sql } from 'drizzle-orm';

// Base pagination and filtering parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// Paginated response format
export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Base controller with common functionality for all transaction endpoints
 */
export abstract class BaseController {
  
  // Method to parse query parameters from request
  protected getQueryParams(c: Context): QueryParams {
    const query = c.req.query();
    
    return {
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '10'),
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
      sortBy: query.sortBy || 'transactionDate',
      sortOrder: (query.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc'
    };
  }
  
  // Method to build WHERE conditions for date range filters
  protected getDateRangeFilter(
    dateField: SQL<unknown>, 
    startDate?: string, 
    endDate?: string
  ): SQL<unknown> | undefined {
    if (startDate && endDate) {
      return sql`${dateField} BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}`;
    } else if (startDate) {
      return sql`${dateField} >= ${new Date(startDate)}`;
    } else if (endDate) {
      return sql`${dateField} <= ${new Date(endDate)}`;
    }
    return undefined;
  }
  
  // Method to build WHERE conditions for amount range filters
  protected getAmountRangeFilter(
    amountField: SQL<unknown>,
    minAmount?: number,
    maxAmount?: number
  ): SQL<unknown> | undefined {
    if (minAmount !== undefined && maxAmount !== undefined) {
      return sql`${amountField} BETWEEN ${minAmount} AND ${maxAmount}`;
    } else if (minAmount !== undefined) {
      return sql`${amountField} >= ${minAmount}`;
    } else if (maxAmount !== undefined) {
      return sql`${amountField} <= ${maxAmount}`;
    }
    return undefined;
  }
  
  // Method to format paginated response
  protected formatPaginatedResponse<T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      data,
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    };
  }
} 