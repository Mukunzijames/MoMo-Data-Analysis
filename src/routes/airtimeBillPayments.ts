import { Hono } from 'hono';
import { AirtimeBillPaymentController } from '../controller/airtimeBillPaymentController';
import { errorHandler } from '../middleware/errorHandler';

// Create router
const router = new Hono();

// Initialize controller
const controller = new AirtimeBillPaymentController();

// Add error handling middleware
router.use('*', errorHandler());

// Get all transactions with pagination and filtering
router.get('/', async (c) => {
  try {
    const transactions = await controller.getAllTransactions(c);
    return c.json(transactions);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

// Get transaction by ID
router.get('/:id', async (c) => {
  try {
    const transaction = await controller.getTransactionById(c);
    return c.json(transaction);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

// Get statistics
router.get('/statistics', async (c) => {
  try {
    const statistics = await controller.getStatistics(c);
    return c.json(statistics);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

// Get top service providers
router.get('/top-providers', async (c) => {
  try {
    const topProviders = await controller.getTopProviders(c);
    return c.json(topProviders);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

// Get bill payment types
router.get('/bill-types', async (c) => {
  try {
    const billTypes = await controller.getBillTypes(c);
    return c.json(billTypes);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

export default router; 