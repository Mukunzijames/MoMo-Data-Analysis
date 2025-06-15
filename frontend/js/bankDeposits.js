// Bank Deposits page specific functions
function initializeBankDeposits() {
    console.log('Initializing Bank Deposits page...');
    loadDepositData();
}

async function loadDepositData() {
    try {
        const response = await fetch('https://mo-mo-data-analysis.vercel.app/api/bank-deposits');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('depositsTableBody');
        tableBody.innerHTML = ''; // Clear existing content

        data.forEach(item => {
            const row = document.createElement('tr');

            // Get status (e.g., success if balance increased)
            const status = parseFloat(item.amount) > 0 ? 'Success' : 'Failed';
            
            // Define status class for styling
            const statusClass = status === 'Success' ? 'status-success' : 'status-failed';

            // Format date
            const date = new Date(item.transactionDate).toLocaleString();
            
            // Extract bank name from description if available
            const bankName = extractBankName(item.description) || 'MTN';

            row.innerHTML = `
                <td>${bankName}</td>
                <td>${item.accountNumber || 'N/A'}</td>
                <td>${formatNumber(parseFloat(item.amount))} RWF</td>
                <td>${item.transactionType || 'Deposit'}</td>
                <td>${date}</td>
                <td>${formatNumber(parseFloat(item.balanceAfter || 0))} RWF</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updateDepositStatistics(data);

    } catch (error) {
        console.error('Error loading deposit data:', error);
    }
}

// Update deposit statistics
function updateDepositStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalDeposits = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgDeposit = totalDeposits > 0 ? totalAmount / totalDeposits : 0;
    
    // Update UI if elements exist
    const totalDepositsEl = document.getElementById('totalDeposits');
    const depositsAmountEl = document.getElementById('depositsAmount');
    const avgDepositEl = document.getElementById('avgDeposit');
    
    if (totalDepositsEl) totalDepositsEl.textContent = totalDeposits;
    if (depositsAmountEl) depositsAmountEl.textContent = formatNumber(totalAmount);
    if (avgDepositEl) avgDepositEl.textContent = formatNumber(Math.round(avgDeposit));
}

// Extract bank name from description
function extractBankName(description) {
    if (!description) return null;
    
    // Common bank names in Rwanda
    const bankPatterns = [
        /bank of kigali|bok/i,
        /equity bank/i,
        /i&m bank/i,
        /kcb/i,
        /access bank/i,
        /ecobank/i,
        /bpr/i,
        /cogebanque/i,
        /gt bank/i,
        /urwego bank/i
    ];
    
    for (const pattern of bankPatterns) {
        const match = description?.match(pattern);
        if (match) {
            return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
        }
    }
    
    return 'Bank';
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('deposit-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'deposit-status-styles';
    styleElement.textContent = `
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
            text-align: center;
        }
        .status-success {
            background-color: #d4edda;
            color: #155724;
        }
        .status-failed {
            background-color: #f8d7da;
            color: #721c24;
        }
    `;
    document.head.appendChild(styleElement);
} 