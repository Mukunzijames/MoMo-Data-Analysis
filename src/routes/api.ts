import { Hono } from 'hono';

// Import the routes
import incomingMoneyRoutes from './incomingMoney';
import cashPowerRoutes from './cashPower';
import thirdPartyRoutes from './thirdParty';
import withdrawalRoutes from './withdrawals'; 
import mobileTransferRoutes from './mobileTransfers';
import bankTransferRoutes from './bankTransfers';
import bundleRoutes from './bundles';
import codeHolderPaymentRoutes from './codeHolderPayments';
import bankDepositRoutes from './bankDeposits';
import airtimeBillPaymentRoutes from './airtimeBillPayments';

// Create the base API router
const api = new Hono();

// Health check endpoint
api.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'API is running'
  });
});

// Mount all routes
api.route('/incoming-money', incomingMoneyRoutes);
api.route('/cash-power', cashPowerRoutes);
api.route('/third-party', thirdPartyRoutes);
api.route('/withdrawals', withdrawalRoutes);
api.route('/mobile-transfers', mobileTransferRoutes);
api.route('/bank-transfers', bankTransferRoutes);
api.route('/bundles', bundleRoutes);
api.route('/code-holder-payments', codeHolderPaymentRoutes);
api.route('/bank-deposits', bankDepositRoutes);
api.route('/airtime-bill-payments', airtimeBillPaymentRoutes);


// Export the API router
export default api; 