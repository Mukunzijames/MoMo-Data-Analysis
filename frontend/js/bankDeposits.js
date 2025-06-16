// Bank Deposits page specific functions
function initializeBankDeposits() {
    console.log('Initializing Bank Deposits page...');
    loadDepositData();
}

async function loadDepositData() {
    try {
        const response = await fetch('http://localhost:3000/api/bank-deposits');
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
        
        // Generate charts
        generateCharts(data);

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

// Generate all charts
function generateCharts(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    generateMonthlyDepositsChart(data);
    generateBankDistributionChart(data);
    generateDepositAmountTrendChart(data);
}

// Generate Monthly Deposits Chart
function generateMonthlyDepositsChart(data) {
    const ctx = document.getElementById('depositsChart');
    
    if (!ctx) return;
    
    // Process data to get monthly deposits
    const monthlyData = processMonthlyDeposits(data);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Number of Deposits',
                data: monthlyData.counts,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Total Amount (RWF)',
                data: monthlyData.amounts,
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                type: 'line',
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Deposits'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Amount (RWF)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Generate Bank Distribution Chart
function generateBankDistributionChart(data) {
    const ctx = document.getElementById('bankDistributionChart');
    
    if (!ctx) return;
    
    // Process data to get distribution by bank
    const bankData = processBankDistribution(data);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: bankData.labels,
            datasets: [{
                data: bankData.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Generate Deposit Amount Trend Chart
function generateDepositAmountTrendChart(data) {
    const ctx = document.getElementById('depositAmountChart');
    
    if (!ctx) return;
    
    // Process data to get deposit trend
    const trendData = processDepositTrend(data);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [{
                label: 'Deposit Amount (RWF)',
                data: trendData.amounts,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
                pointRadius: 4,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)'
            }]
        },
        options: {
            responsive: true,
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
                        text: 'Date'
                    }
                }
            }
        }
    });
}

// Process data for monthly deposits chart
function processMonthlyDeposits(data) {
    // Create map to store deposits by month
    const months = {};
    const amountsByMonth = {};
    
    // Process each transaction
    data.forEach(item => {
        if (!item.transactionDate) return;
        
        const date = new Date(item.transactionDate);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        // Count deposits by month
        if (!months[monthYear]) {
            months[monthYear] = 0;
            amountsByMonth[monthYear] = 0;
        }
        
        months[monthYear]++;
        amountsByMonth[monthYear] += parseFloat(item.amount || 0);
    });
    
    // Sort by date
    const sortedMonths = Object.keys(months).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });
    
    return {
        labels: sortedMonths,
        counts: sortedMonths.map(month => months[month]),
        amounts: sortedMonths.map(month => amountsByMonth[month])
    };
}

// Process data for bank distribution chart
function processBankDistribution(data) {
    // Create map to store deposits by bank
    const banks = {};
    
    // Process each transaction
    data.forEach(item => {
        const bankName = extractBankName(item.description) || 'Other';
        
        if (!banks[bankName]) {
            banks[bankName] = 0;
        }
        
        banks[bankName]++;
    });
    
    // Sort by count in descending order
    const sortedBanks = Object.keys(banks).sort((a, b) => banks[b] - banks[a]);
    
    return {
        labels: sortedBanks,
        values: sortedBanks.map(bank => banks[bank])
    };
}

// Process data for deposit trend chart
function processDepositTrend(data) {
    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
        return new Date(a.transactionDate) - new Date(b.transactionDate);
    });
    
    const labels = [];
    const amounts = [];
    
    // Process each transaction
    sortedData.forEach(item => {
        if (!item.transactionDate) return;
        
        const date = new Date(item.transactionDate).toLocaleDateString();
        labels.push(date);
        amounts.push(parseFloat(item.amount || 0));
    });
    
    return {
        labels,
        amounts
    };
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

// Initialize the page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeBankDeposits); 