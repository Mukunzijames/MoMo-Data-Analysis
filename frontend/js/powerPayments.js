// Cash Power Payments page specific functions
function initializePowerPayments() {
    console.log('Initializing Cash Power Payments page...');
    loadPowerPaymentsData();
}

async function loadPowerPaymentsData() {
    try {
        const response = await fetch('https://mo-mo-data-analysis.vercel.app/api/cash-power');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('powerTableBody');
        tableBody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');

            // Define status based on transaction status
            const status = item.status || 'Successful';
            
            // Define status class for styling
            const statusClass = status === 'Successful' ? 'status-success' : 
                               (status === 'Pending' ? 'status-pending' : 'status-failed');

            // Format date
            const date = new Date(item.transactionDate).toLocaleString();

            row.innerHTML = `
                <td>${item.meterNumber || 'N/A'}</td>
                <td>${item.customerName || 'N/A'}</td>
                <td>${formatNumber(parseFloat(item.amount))} RWF</td>
                <td>${item.units || 'N/A'}</td>
                <td>${date}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updatePowerPaymentsStatistics(data);

    } catch (error) {
        console.error('Error loading cash power payments data:', error);
        const tableBody = document.getElementById('powerTableBody');
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data. Please try again later.</td></tr>';
    }
}

// Update cash power payments statistics
function updatePowerPaymentsStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransactions = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Update UI if elements exist
    const totalPowerEl = document.getElementById('totalPower');
    const powerAmountEl = document.getElementById('powerAmount');
    const avgPowerEl = document.getElementById('avgPower');
    
    if (totalPowerEl) totalPowerEl.textContent = totalTransactions;
    if (powerAmountEl) powerAmountEl.textContent = formatNumber(totalAmount);
    if (avgPowerEl) avgPowerEl.textContent = formatNumber(Math.round(avgTransaction));
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('power-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'power-status-styles';
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
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-failed {
            background-color: #f8d7da;
            color: #721c24;
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializePowerPayments); 