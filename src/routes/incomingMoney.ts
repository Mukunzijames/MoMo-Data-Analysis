import { Hono } from 'hono';
import { IncomingMoneyController } from '../controller/incomingMoneyController';
import { errorHandler } from '../middleware/errorHandler';

// Create router
const router = new Hono();

// Initialize controller
const controller = new IncomingMoneyController();

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

// Get top senders
router.get('/top-senders', async (c) => {
  try {
    const topSenders = await controller.getTopSenders(c);
    return c.json(topSenders);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: 'An unknown error occurred' }, 500);
  }
});

export default router; 