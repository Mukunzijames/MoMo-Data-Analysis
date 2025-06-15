// Third Party Transactions page specific functions
function initializeThirdParty() {
    console.log('Initializing Third Party Transactions page...');
    loadThirdPartyData();
}

async function loadThirdPartyData() {
    try {
        const response = await fetch('https://mo-mo-data-analysis.vercel.app/api/third-party');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('thirdPartyTableBody');
        tableBody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');

            // Define status based on transaction status
            const status = item.status || 'Completed';
            
            // Define status class for styling
            const statusClass = status === 'Completed' ? 'status-success' : 
                               (status === 'Pending' ? 'status-pending' : 'status-failed');

            // Format date
            const date = new Date(item.transactionDate).toLocaleString();

            row.innerHTML = `
                <td>${item.provider || 'N/A'}</td>
                <td>${item.category || 'Other'}</td>
                <td>${formatNumber(parseFloat(item.amount))} RWF</td>
                <td>${date}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updateThirdPartyStatistics(data);

    } catch (error) {
        console.error('Error loading third party transactions data:', error);
        const tableBody = document.getElementById('thirdPartyTableBody');
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

// Update third party statistics
function updateThirdPartyStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransactions = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Update UI if elements exist
    const totalThirdPartyEl = document.getElementById('totalThirdParty');
    const thirdPartyAmountEl = document.getElementById('thirdPartyAmount');
    const avgThirdPartyEl = document.getElementById('avgThirdParty');
    
    if (totalThirdPartyEl) totalThirdPartyEl.textContent = totalTransactions;
    if (thirdPartyAmountEl) thirdPartyAmountEl.textContent = formatNumber(totalAmount);
    if (avgThirdPartyEl) avgThirdPartyEl.textContent = formatNumber(Math.round(avgTransaction));
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('third-party-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'third-party-status-styles';
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
document.addEventListener('DOMContentLoaded', initializeThirdParty); 