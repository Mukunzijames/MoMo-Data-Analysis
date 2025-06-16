// Bank Transfers page specific functions
function initializeBankTransfers() {
    console.log('Initializing Bank Transfers page...');
    loadBankTransfersData();
    
    // Initialize preset amounts for bank transfer form
    initializePresetAmountButtons();
}

function initializePresetAmountButtons() {
    const presetButtons = document.querySelectorAll('.preset-amount');
    const amountInput = document.getElementById('transferAmount');
    
    if (!presetButtons.length || !amountInput) return;
    
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            amountInput.value = amount;
        });
    });
}

async function loadBankTransfersData() {
    try {
        const response = await fetch('http://localhost:3000/api/bank-transfers');
        const json = await response.json();
        let data = json.data;
        
        // If there's no API data available, use the mock data from the HTML table
        if (!data || !Array.isArray(data) || data.length === 0) {
            data = extractTableData();
        }
        
        // Update table with data
        updateBankTransfersTable(data);
        
        // Update statistics
        updateBankTransfersStatistics(data);
        
        // Initialize charts with table data
        initializeBankTransferCharts(data);

    } catch (error) {
        console.error('Error fetching bank transfers:', error);
        
        // Use table data as fallback
        const tableData = extractTableData();
        
        // Update statistics with table data
        updateBankTransfersStatistics(tableData);
        
        // Initialize charts with table data
        initializeBankTransferCharts(tableData);
        
        // Show error message only if we couldn't extract table data
        if (!tableData.length) {
            const tableBody = document.getElementById('bankTransfersTableBody');
            tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
        }
    }
}

// Extract data from the existing HTML table
function extractTableData() {
    const tableBody = document.getElementById('bankTransfersTableBody');
    const data = [];
    
    if (!tableBody) return data;
    
    // Get all table rows except header
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Skip rows that have a colspan (usually error messages)
        if (cells.length === 5) {
            data.push({
                bankName: cells[0].textContent.trim(),
                accountNumber: cells[1].textContent.trim(),
                amount: parseFloat(cells[2].textContent.replace('RWF', '').replace(/,/g, '').trim()),
                transactionDate: cells[3].textContent.trim(),
                status: cells[4].textContent.trim()
            });
        }
    });
    
    return data;
}

// Update bank transfers table
function updateBankTransfersTable(data) {
    const tableBody = document.getElementById('bankTransfersTableBody');
    if (!tableBody || !data) return;
    
    tableBody.innerHTML = ''; // Clear previous data
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Define status based on transaction status
        const status = item.status || 'Completed';
        
        // Define status class for styling
        const statusClass = status === 'Completed' ? 'status-success' : 
                          (status === 'Pending' ? 'status-pending' : 'status-failed');

        // Format date
        const date = item.transactionDate ? new Date(item.transactionDate).toLocaleString() : 'N/A';

        row.innerHTML = `
            <td>${item.bankName || 'N/A'}</td>
            <td>${item.accountNumber || 'N/A'}</td>
            <td>${formatNumber(parseFloat(item.amount))} RWF</td>
            <td>${date}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
        `;

        tableBody.appendChild(row);
    });
    
    // Add CSS for status indicators if not already added
    addStatusStyles();
}

// Update bank transfers statistics with animation
function updateBankTransfersStatistics(data) {
    if (!data || !Array.isArray(data)) {
        data = [];
    }
    
    // Calculate statistics
    const totalTransfers = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransfer = totalTransfers > 0 ? totalAmount / totalTransfers : 0;
    
    // Update UI with animation
    animateCounter('totalBankTransfers', totalTransfers);
    animateCounter('bankTransferAmount', totalAmount);
    animateCounter('avgBankTransfer', Math.round(avgTransfer));
    
    // Also add elements for successful/failed statistics

}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('bank-transfers-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'bank-transfers-status-styles';
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
        .card {
            transition: all 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize bank transfer charts with data
function initializeBankTransferCharts(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Group data by bank
    const bankData = {};
    data.forEach(item => {
        const bank = item.bankName || 'Unknown';
        if (!bankData[bank]) {
            bankData[bank] = { 
                count: 0, 
                totalAmount: 0 
            };
        }
        bankData[bank].count++;
        bankData[bank].totalAmount += parseFloat(item.amount || 0);
    });
    
    // Group data by date (for monthly trend)
    const monthlyData = {};
    data.forEach(item => {
        if (!item.transactionDate) return;
        
        let dateKey;
        try {
            const date = new Date(item.transactionDate);
            dateKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        } catch (e) {
            return; // Skip if date parsing fails
        }
        
        if (!monthlyData[dateKey]) {
            monthlyData[dateKey] = { 
                count: 0, 
                totalAmount: 0 
            };
        }
        monthlyData[dateKey].count++;
        monthlyData[dateKey].totalAmount += parseFloat(item.amount || 0);
    });
    
    // Sort monthly data by date
    const sortedMonthlyLabels = Object.keys(monthlyData).sort();
    const sortedMonthlyCounts = sortedMonthlyLabels.map(key => monthlyData[key].count);
    const sortedMonthlyAmounts = sortedMonthlyLabels.map(key => monthlyData[key].totalAmount);
    
    // Format monthly labels to be more readable
    const formattedMonthlyLabels = sortedMonthlyLabels.map(key => {
        const [year, month] = key.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    
    // Monthly transfers chart
    const ctx = document.getElementById('bankTransfersChart');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedMonthlyLabels,
                datasets: [{
                    label: 'Number of Transfers',
                    data: sortedMonthlyCounts,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Transfers'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Monthly Bank Transfers Trends'
                    }
                }
            }
        });
    }
    
    // Bank distribution chart (using actual data)
    const bankLabels = Object.keys(bankData);
    const bankCounts = bankLabels.map(key => bankData[key].count);
    
    const bankCtx = document.getElementById('bankDistributionChart');
    if (bankCtx) {
        const bankChart = new Chart(bankCtx, {
            type: 'doughnut',
            data: {
                labels: bankLabels,
                datasets: [{
                    data: bankCounts,
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(0, 107, 134, 0.7)',
                        'rgba(255, 149, 0, 0.7)',
                        'rgba(255, 210, 0, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(0, 107, 134, 1)',
                        'rgba(255, 149, 0, 1)',
                        'rgba(255, 210, 0, 1)',
                        'rgba(108, 117, 125, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Transfers by Bank'
                    }
                }
            }
        });
    }
    
    // Amount trends chart by bank
    const amountCtx = document.getElementById('bankTransferAmountChart');
    if (amountCtx) {
        const bankAmounts = bankLabels.map(key => bankData[key].totalAmount);
        
        const amountChart = new Chart(amountCtx, {
            type: 'bar',
            data: {
                labels: bankLabels,
                datasets: [{
                    label: 'Total Amount (RWF)',
                    data: bankAmounts,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (RWF)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Bank'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Transfer Amounts by Bank'
                    }
                }
            }
        });
    }
}

// Initialize bank transfer filters
function initializeBankTransferFilters() {
    const dateFilterSelect = document.getElementById('bankTransfersDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            loadBankTransfersData(); // Reload data with new filter
        });
    }
    
    const bankFilterSelect = document.getElementById('bankFilter');
    if (bankFilterSelect) {
        bankFilterSelect.addEventListener('change', function() {
            loadBankTransfersData(); // Reload data with new filter
        });
    }
}

// Mask account number for security
function maskAccountNumber(accountNumber) {
    if (!accountNumber) return 'N/A';
    return '****' + accountNumber.slice(-4);
}

// Counter animation function
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1500; // Animation duration in milliseconds
    const steps = 60; // Number of steps
    const stepValue = targetValue / steps;
    let currentValue = 0;
    let currentStep = 0;
    
    const interval = setInterval(() => {
        currentStep++;
        currentValue += stepValue;
        
        if (currentStep >= steps) {
            clearInterval(interval);
            element.textContent = formatNumber(Math.round(targetValue));
        } else {
            element.textContent = formatNumber(Math.floor(currentValue));
        }
    }, duration / steps);
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeBankTransfers();
    initializeBankTransferFilters();
}); 