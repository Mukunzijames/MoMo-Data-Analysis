// incoming-money.js

// Global variables
let transactions = [];
let isContentLoaded = false;
let isFetching = false;

// Function to initialize the page
function initIncomingMoneyPage() {
  if (isContentLoaded) return;
  
  loadTransactions();
  setupEventListeners();
  isContentLoaded = true;
}

// Function to load transactions from XML
function loadTransactions() {
  if (isFetching) return;
  isFetching = true;
  
  // Show loading state
  document.getElementById('transactionsTableBody').innerHTML = 
    '<tr><td colspan="5" class="loading-row">Loading transactions...</td></tr>';
  
  fetch('../momo_sms.xml')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.text();
    })
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
      transactions = processXmlData(data);
      updateSummaryCards();
      populateTransactionsTable();
    })
    .catch(error => {
      console.error('Error loading transactions:', error);
      document.getElementById('transactionsTableBody').innerHTML = 
        '<tr><td colspan="5" class="error-row">Error loading transactions. Please try again.</td></tr>';
    })
    .finally(() => {
      isFetching = false;
    });
}

// Process XML data into JavaScript objects
function processXmlData(xmlData) {
  const transactions = [];
  const items = xmlData.getElementsByTagName('transaction');
  
  for (let item of items) {
    transactions.push({
      sender: item.getElementsByTagName('sender')[0]?.textContent || 'Unknown',
      phone: item.getElementsByTagName('phone')[0]?.textContent || 'N/A',
      amount: item.getElementsByTagName('amount')[0]?.textContent || '0',
      date: item.getElementsByTagName('date')[0]?.textContent || new Date().toISOString(),
      status: item.getElementsByTagName('status')[0]?.textContent || 'Completed',
      txId: item.getElementsByTagName('txId')[0]?.textContent || 'N/A',
      message: item.getElementsByTagName('message')[0]?.textContent || ''
    });
  }
  
  return transactions;
}

// Update summary cards with transaction data
function updateSummaryCards() {
  const totalReceived = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const thisMonthTotal = calculateThisMonthTotal(transactions);
  
  document.getElementById('totalReceived').textContent = formatCurrency(totalReceived) + ' RWF';
  document.getElementById('transactionCount').textContent = transactions.length;
  document.getElementById('thisMonth').textContent = formatCurrency(thisMonthTotal) + ' RWF';
}

// Populate the transactions table
function populateTransactionsTable() {
  const tableBody = document.getElementById('transactionsTableBody');
  tableBody.innerHTML = '';
  
  if (transactions.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No transactions found</td></tr>';
    return;
  }
  
  transactions.forEach(tx => {
    const row = document.createElement('tr');
    const names = tx.sender.split(' ');
    const initials = names[0].charAt(0) + (names.length > 1 ? names[1].charAt(0) : '');
    
    // Sanitize data for HTML insertion
    const safeSender = escapeHtml(tx.sender);
    const safePhone = escapeHtml(tx.phone);
    const safeAmount = escapeHtml(formatCurrency(tx.amount));
    const safeDate = escapeHtml(formatDate(tx.date));
    const safeTxId = escapeHtml(tx.txId);
    const safeMessage = escapeHtml(tx.message);
    
    row.innerHTML = `
      <td>
        <div class="transaction-sender">
          <div class="transaction-sender-avatar">${initials}</div>
          <div class="transaction-sender-info">
            <h4>${safeSender}</h4>
            <p>${safePhone}</p>
          </div>
        </div>
      </td>
      <td class="transaction-amount">${safeAmount} RWF</td>
      <td class="transaction-date">${safeDate}</td>
      <td><span class="transaction-status status-${tx.status.toLowerCase()}">${tx.status}</span></td>
      <td class="transaction-actions">
        <button onclick="showTransactionDetails('${safeSender}', '${safeAmount} RWF', '${safeDate}', '${safeTxId}', '${safeMessage}')">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Helper functions
function calculateThisMonthTotal(transactions) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return transactions.reduce((sum, tx) => {
    const txDate = new Date(tx.date);
    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      return sum + parseFloat(tx.amount);
    }
    return sum;
  }, 0);
}

function formatCurrency(amount) {
  return parseFloat(amount).toLocaleString('en-RW');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Export data function
function exportData() {
  if (transactions.length === 0) {
    alert('No transactions to export');
    return;
  }
  
  let csv = 'Sender,Phone,Amount,Date,Status,Transaction ID,Message\n';
  transactions.forEach(tx => {
    csv += `"${tx.sender.replace(/"/g, '""')}","${tx.phone}","${tx.amount}","${tx.date}","${tx.status}","${tx.txId}","${tx.message.replace(/"/g, '""')}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `momo_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  
  // Close modal when clicking outside
  document.addEventListener('click', function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Global functions accessible from HTML
window.showTransactionDetails = function(sender, amount, date, txId, message) {
  document.getElementById('modalRecipient').textContent = sender;
  document.getElementById('modalAmount').textContent = amount;
  document.getElementById('modalDate').textContent = date;
  document.getElementById('modalTxId').textContent = txId;
  document.getElementById('modalSmsMessage').textContent = message;
  document.getElementById('transactionModal').style.display = 'block';
};

window.closeModal = function() {
  document.getElementById('transactionModal').style.display = 'none';
};

window.copySmsMessage = function() {
  const message = document.getElementById('modalSmsMessage').textContent;
  navigator.clipboard.writeText(message).then(() => {
    alert('Message copied to clipboard!');
  });
};

window.downloadReceipt = function() {
  alert('Receipt download functionality would be implemented here');
  // Implement actual receipt download logic
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initIncomingMoneyPage);