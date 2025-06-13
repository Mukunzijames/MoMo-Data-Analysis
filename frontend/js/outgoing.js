// DOM Elements
const transactionModal = document.getElementById('transactionModal');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const sidebarToggle = document.getElementById('sidebarToggle');

// Transaction Details Modal Functions
function showTransactionDetails(recipient, amount, date, txId, message) {
  document.getElementById('modalRecipient').textContent = recipient;
  document.getElementById('modalAmount').textContent = amount;
  document.getElementById('modalDate').textContent = date;
  document.getElementById('modalTxId').textContent = txId;
  document.getElementById('modalSmsMessage').textContent = message;
  transactionModal.style.display = 'block';
}

function closeModal() {
  transactionModal.style.display = 'none';
}

function copySmsMessage() {
  const message = document.getElementById('modalSmsMessage').textContent;
  navigator.clipboard.writeText(message).then(() => {
    alert('Message copied to clipboard!');
  });
}

function downloadReceipt() {
  alert('Receipt download functionality would be implemented here');
}

// Event Listeners
exportBtn.addEventListener('click', () => {
  alert('Export functionality would be implemented here');
});

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const rows = document.querySelectorAll('.transaction-table tbody tr');
  
  rows.forEach(row => {
    const recipient = row.querySelector('.transaction-recipient-info h4').textContent.toLowerCase();
    const amount = row.querySelector('.transaction-amount').textContent.toLowerCase();
    const date = row.querySelector('.transaction-date').textContent.toLowerCase();
    
    if (recipient.includes(searchTerm) || amount.includes(searchTerm) || date.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
});

sidebarToggle.addEventListener('click', () => {
  document.querySelector('.sidebar-nav').classList.toggle('show');
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === transactionModal) {
    closeModal();
  }
});