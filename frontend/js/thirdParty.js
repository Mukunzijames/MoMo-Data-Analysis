// Third Party Transactions page specific functions
function initializeThirdParty() {
    console.log('Initializing Third Party Transactions page...');
    setupEventListeners();
    loadThirdPartyData();
}

// Setup event listeners
function setupEventListeners() {
    // Date range filter change handler
    const dateFilter = document.getElementById('thirdPartyDateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            loadThirdPartyData();
        });
    }

    // Category filter change handler
    const categoryFilter = document.getElementById('thirdPartyCategoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            loadThirdPartyData();
        });
    }

    // Quick payment form submission
    const quickPaymentForm = document.getElementById('quickPaymentForm');
    if (quickPaymentForm) {
        quickPaymentForm.addEventListener('submit', handleQuickPayment);
    }

    // Preset amount buttons
    const presetButtons = document.querySelectorAll('.preset-amount');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('thirdPartyAmount').value = button.getAttribute('data-amount');
        });
    });
}

// Handle quick payment submission
async function handleQuickPayment(event) {
    event.preventDefault();
    
    const provider = document.getElementById('serviceProvider').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const amount = document.getElementById('thirdPartyAmount').value;
    
    if (!provider || !accountNumber || !amount) {
        alert('Please fill all the required fields');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/third-party/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider,
                accountNumber,
                amount
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Payment successful!');
            document.getElementById('quickPaymentForm').reset();
            loadThirdPartyData(); // Reload data to reflect new payment
        } else {
            alert(`Payment failed: ${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('Payment processing failed. Please try again later.');
    }
}

async function loadThirdPartyData() {
    try {
        // Get filter values
        const dateRange = document.getElementById('thirdPartyDateFilter').value;
        const category = document.getElementById('thirdPartyCategoryFilter').value;
        
        // Construct API URL with query parameters
        let apiUrl = 'http://localhost:3000/api/third-party';
        const params = new URLSearchParams();
        
        if (dateRange && dateRange !== 'all') {
            params.append('dateRange', dateRange);
        }
        
        if (category && category !== 'all') {
            params.append('category', category);
        }
        
        if (params.toString()) {
            apiUrl += `?${params.toString()}`;
        }
        
        const response = await fetch(apiUrl);
        const jsonData = await response.json();
        const data = jsonData.data;

        // Update the table with the data
        updateTransactionTable(data);
        
        // Update statistics
        updateThirdPartyStatistics(data);
        
        // Generate charts with the data
        generateCharts(data);

    } catch (error) {
        console.error('Error loading third party transactions data:', error);
        const tableBody = document.getElementById('thirdPartyTableBody');
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

function updateTransactionTable(data) {
    const tableBody = document.getElementById('thirdPartyTableBody');
    tableBody.innerHTML = ''; // Clear previous rows
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No transactions found</td></tr>';
        return;
    }

    data.slice(0, 10).forEach(item => { // Show only first 10 transactions in the table
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
    const thirdPartyAmountEl = document.getElementById('thirdPartyTotalAmount');
    const avgThirdPartyEl = document.getElementById('avgThirdParty');
    
    if (totalThirdPartyEl) totalThirdPartyEl.textContent = totalTransactions;
    if (thirdPartyAmountEl) {
        thirdPartyAmountEl.textContent = formatNumber(totalAmount);
    }
    if (avgThirdPartyEl) avgThirdPartyEl.textContent = formatNumber(Math.round(avgTransaction));
}

// Generate all charts based on the data
function generateCharts(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    generateMonthlyTrendsChart(data);
    generateAmountTrendsChart(data);
    generateCategoryDistributionChart(data);
}

// Generate monthly transaction trends chart
function generateMonthlyTrendsChart(data) {
    const canvas = document.getElementById('thirdPartyChart');
    if (!canvas) return;
    
    // Process data for chart - group by month
    const monthlyData = processMonthlyData(data);
    
    // If there is an existing chart, destroy it
    if (window.thirdPartyMonthlyChart) {
        window.thirdPartyMonthlyChart.destroy();
    }
    
    // Create the chart
    window.thirdPartyMonthlyChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Number of Transactions',
                data: monthlyData.counts,
                borderColor: '#3E64FF',
                backgroundColor: 'rgba(62, 100, 255, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Third-Party Transaction Trends'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Transactions'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Generate amount trends chart
function generateAmountTrendsChart(data) {
    const canvas = document.getElementById('thirdPartyAmountChart');
    if (!canvas) return;
    
    // Process data for chart - group by month
    const monthlyData = processMonthlyAmountData(data);
    
    // If there is an existing chart, destroy it
    if (window.thirdPartyAmountTrendsChart) {
        window.thirdPartyAmountTrendsChart.destroy();
    }
    
    // Create the chart
    window.thirdPartyAmountTrendsChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthlyData.labels,
            datasets: [{
                label: 'Transaction Amount (RWF)',
                data: monthlyData.amounts,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Transaction Amount Trends'
                }
            },
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
                        text: 'Month'
                    }
                }
            }
        }
    });
}

// Generate category distribution pie chart
function generateCategoryDistributionChart(data) {
    const canvas = document.getElementById('providerDistributionChart');
    if (!canvas) return;
    
    // Process data for chart - group by category
    const categoryData = processCategoryData(data);
    
    // Define color palette
    const colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
        '#FF9F40', '#8AC249', '#EA8635', '#5D7F99', '#5D3E6D'
    ];
    
    // If there is an existing chart, destroy it
    if (window.categoryDistributionChart) {
        window.categoryDistributionChart.destroy();
    }
    
    // Create the chart
    window.categoryDistributionChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: categoryData.categories,
            datasets: [{
                data: categoryData.counts,
                backgroundColor: colorPalette.slice(0, categoryData.categories.length),
                hoverOffset: 4
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
                    text: 'Transaction Categories Distribution'
                }
            }
        }
    });
}

// Process data to get monthly transaction counts
function processMonthlyData(data) {
    // Create a map to store monthly transaction counts
    const monthlyMap = new Map();
    
    // Process each transaction
    data.forEach(item => {
        const date = new Date(item.transactionDate);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (monthlyMap.has(monthYear)) {
            monthlyMap.set(monthYear, monthlyMap.get(monthYear) + 1);
        } else {
            monthlyMap.set(monthYear, 1);
        }
    });
    
    // Sort the map by date
    const sortedMap = new Map([...monthlyMap.entries()].sort((a, b) => {
        const [aMonth, aYear] = a[0].split('/');
        const [bMonth, bYear] = b[0].split('/');
        
        if (aYear !== bYear) {
            return aYear - bYear;
        }
        
        return aMonth - bMonth;
    }));
    
    // Extract labels and counts
    const labels = [...sortedMap.keys()];
    const counts = [...sortedMap.values()];
    
    return { labels, counts };
}

// Process data to get monthly transaction amounts
function processMonthlyAmountData(data) {
    // Create a map to store monthly transaction amounts
    const monthlyMap = new Map();
    
    // Process each transaction
    data.forEach(item => {
        const date = new Date(item.transactionDate);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        const amount = parseFloat(item.amount || 0);
        
        if (monthlyMap.has(monthYear)) {
            monthlyMap.set(monthYear, monthlyMap.get(monthYear) + amount);
        } else {
            monthlyMap.set(monthYear, amount);
        }
    });
    
    // Sort the map by date
    const sortedMap = new Map([...monthlyMap.entries()].sort((a, b) => {
        const [aMonth, aYear] = a[0].split('/');
        const [bMonth, bYear] = b[0].split('/');
        
        if (aYear !== bYear) {
            return aYear - bYear;
        }
        
        return aMonth - bMonth;
    }));
    
    // Extract labels and amounts
    const labels = [...sortedMap.keys()];
    const amounts = [...sortedMap.values()];
    
    return { labels, amounts };
}

// Process data to get category distribution
function processCategoryData(data) {
    // Create a map to store category counts
    const categoryMap = new Map();
    
    // Process each transaction
    data.forEach(item => {
        const category = item.category || 'Other';
        
        if (categoryMap.has(category)) {
            categoryMap.set(category, categoryMap.get(category) + 1);
        } else {
            categoryMap.set(category, 1);
        }
    });
    
    // Sort the map by count in descending order
    const sortedMap = new Map([...categoryMap.entries()].sort((a, b) => b[1] - a[1]));
    
    // Extract categories and counts
    const categories = [...sortedMap.keys()];
    const counts = [...sortedMap.values()];
    
    return { categories, counts };
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