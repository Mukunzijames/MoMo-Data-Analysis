// Cash Power Bill Payments page specific functions
function initializePowerPayments() {
    // Initialize filter elements
    initializePowerFilters();
    
    // Load data from API
    loadPowerData();
    
    // Load statistics
    loadPowerStatistics();
    
    // Load monthly trend data
    loadPowerTrendData();
    
    // Initialize quick purchase form
    initializeQuickPurchaseForm();
}

// Load power payments statistics
async function loadPowerStatistics() {
    try {
        const statsElement = document.querySelector('.stats-cards');
        if (!statsElement) return;
        
        UI.showLoading(statsElement);
        
        const statistics = await API.getCashPowerStatistics();
        
        if (!statistics) {
            throw new Error('Failed to load statistics');
        }
        
        // Update statistics cards
        document.getElementById('totalPower').textContent = statistics.count || 0;
        document.getElementById('powerAmount').textContent = UI.formatMoney(statistics.totalAmount || 0);
        document.getElementById('avgPower').textContent = UI.formatMoney(statistics.averageAmount || 0);
        
    } catch (error) {
        console.error('Error loading power statistics:', error);
        const statsElement = document.querySelector('.stats-cards');
        if (statsElement) {
            UI.showError(statsElement, 'Failed to load statistics');
        }
    }
}

// Load cash power transaction data from API
async function loadPowerData(page = 1) {
    try {
        const tableContainer = document.querySelector('.transactions-table');
        const tableBody = document.getElementById('powerTableBody');
        if (!tableBody || !tableContainer) return;
        
        UI.showLoading(tableContainer);
        
        // Get filter values
        const dateFilter = document.getElementById('powerDateFilter')?.value;
        
        // Calculate date ranges based on filter
        let startDate, endDate;
        if (dateFilter) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0];
            
            if (dateFilter === 'today') {
                startDate = endDate;
            } else if (dateFilter === 'yesterday') {
                const yesterday = new Date(now.setDate(now.getDate() - 1));
                startDate = yesterday.toISOString().split('T')[0];
                endDate = startDate;
            } else if (dateFilter === 'last7days') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                startDate = weekAgo.toISOString().split('T')[0];
            } else if (dateFilter === 'last30days') {
                const monthAgo = new Date(now.setDate(now.getDate() - 30));
                startDate = monthAgo.toISOString().split('T')[0];
            } else if (dateFilter === 'thisMonth') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate = firstDay.toISOString().split('T')[0];
            } else if (dateFilter === 'lastMonth') {
                const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                startDate = firstDayLastMonth.toISOString().split('T')[0];
                const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                endDate = lastDayLastMonth.toISOString().split('T')[0];
            }
        }
        
        // Prepare API parameters
        const params = {
            page,
            limit: 10,
            startDate,
            endDate
        };
        
        // Fetch transactions data from API
        const response = await API.getCashPowerTransactions(params);
        
        if (!response || !response.data) {
            throw new Error('Failed to load transactions');
        }
        
        const { data: transactions, metadata } = response;
        
        // Render transactions table
        renderPowerTransactionsTable(transactions, tableBody);
        
        // Add pagination if container exists
        const paginationContainer = document.getElementById('powerPagination');
        if (paginationContainer) {
            UI.renderPagination(metadata, 'powerPagination', (newPage) => {
                loadPowerData(newPage);
            });
        }
        
    } catch (error) {
        console.error('Error loading power transactions:', error);
        const tableContainer = document.querySelector('.transactions-table');
        if (tableContainer) {
            UI.showError(tableContainer, 'Failed to load transaction data');
        }
    }
}

// Render power transactions table
function renderPowerTransactionsTable(transactions, tableBody) {
    if (!transactions || !tableBody) return;
    
    let html = '';
    
    if (transactions.length === 0) {
        html = '<tr><td colspan="7" class="no-data">No transactions found</td></tr>';
    } else {
        transactions.forEach(transaction => {
            // Determine status based on if the transaction was successful
            const status = transaction.fee >= 0 ? 'success' : 'failed';
            
            // Estimate units based on amount (example calculation)
            const estimatedUnits = (transaction.amount / 195).toFixed(1);
            
            html += `
                <tr>
                    <td>${transaction.token || 'N/A'}</td>
                    <td>${transaction.recipient || 'N/A'}</td>
                    <td>RWF ${UI.formatMoney(transaction.amount)}</td>
                    <td>${estimatedUnits} kWh</td>
                    <td>${UI.formatDate(transaction.transactionDate)}</td>
                    <td><span class="status status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                    <td>
                        <button class="action-btn" data-transaction-id="${transaction.id}">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    tableBody.innerHTML = html;
    
    // Add event listeners to action buttons
    const actionButtons = tableBody.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-transaction-id');
            showTransactionDetails(transactionId);
        });
    });
}

// Load monthly trend data from API
async function loadPowerTrendData() {
    try {
        const chartContainer = document.querySelector('.chart-card');
        if (!chartContainer) return;
        
        UI.showLoading(chartContainer);
        
        // Get monthly trends
        const monthlyTrends = await API.getCashPowerMonthlyTrends();
        
        // Get statistics
        const statistics = await API.getCashPowerStatistics();
        
        // Initialize charts with real data
        initializePowerCharts(monthlyTrends, statistics);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        const chartContainer = document.querySelector('.chart-card');
        if (chartContainer) {
            UI.showError(chartContainer, 'Failed to load chart data');
        }
    }
}

// Initialize power charts with real data
function initializePowerCharts(monthlyTrends, statistics) {
    if (!monthlyTrends || !statistics) return;
    
    // Prepare data for monthly trends
    const months = monthlyTrends.map(item => {
        const [year, month] = item.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'short' });
    });
    
    const transactionCounts = monthlyTrends.map(item => item.transactionCount);
    const transactionAmounts = monthlyTrends.map(item => item.totalAmount);
    
    // Transactions count chart
    const ctx = document.getElementById('powerChart');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Number of Transactions',
                    data: transactionCounts,
                    backgroundColor: 'rgba(0, 107, 134, 0.7)',
                    borderColor: 'rgba(0, 107, 134, 1)',
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
                            text: 'Number of Transactions'
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
                        text: 'Cash Power Purchases Trends'
                    }
                }
            }
        });
    }
    
    // Amount trends chart
    const amountCtx = document.getElementById('powerAmountChart');
    if (amountCtx) {
        const amountChart = new Chart(amountCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Total Amount (RWF)',
                    data: transactionAmounts,
                    backgroundColor: 'rgba(255, 210, 0, 0.1)',
                    borderColor: 'rgba(255, 210, 0, 1)',
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
                            text: 'Amount (RWF)'
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
                        text: 'Cash Power Amount Trends'
                    }
                }
            }
        });
    }
    
    // Create amount distribution buckets
    const amountBuckets = {
        '1,000 or less': 0,
        '1,001 - 5,000': 0,
        '5,001 - 10,000': 0,
        '10,001 - 20,000': 0,
        '20,001+': 0
    };
    
    // Placeholder for distribution data (since we don't have real distribution data)
    // In a real application, you'd calculate this from transaction data
    amountBuckets['1,000 or less'] = 15;
    amountBuckets['1,001 - 5,000'] = 35;
    amountBuckets['5,001 - 10,000'] = 25;
    amountBuckets['10,001 - 20,000'] = 20;
    amountBuckets['20,001+'] = 5;
    
    // Amount distribution chart
    const distributionCtx = document.getElementById('powerDistributionChart');
    if (distributionCtx) {
        const distributionChart = new Chart(distributionCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(amountBuckets),
                datasets: [{
                    data: Object.values(amountBuckets),
                    backgroundColor: [
                        'rgba(0, 107, 134, 0.7)',
                        'rgba(255, 210, 0, 0.7)',
                        'rgba(255, 149, 0, 0.7)',
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ],
                    borderColor: [
                        'rgba(0, 107, 134, 1)',
                        'rgba(255, 210, 0, 1)',
                        'rgba(255, 149, 0, 1)',
                        'rgba(76, 175, 80, 1)',
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
                        text: 'Cash Power by Amount (%)'
                    }
                }
            }
        });
    }
}

// Initialize power filters
function initializePowerFilters() {
    const dateFilterSelect = document.getElementById('powerDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            loadPowerData(1); // Reload data with page 1
        });
    }
}

// Initialize quick purchase form
function initializeQuickPurchaseForm() {
    const quickPurchaseForm = document.getElementById('quickPurchaseForm');
    if (!quickPurchaseForm) return;
    
    quickPurchaseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const meterNumber = document.getElementById('meterNumber').value;
        const amount = document.getElementById('powerAmount').value;
        
        // For demonstration, we'll just show an alert
        alert(`Cash Power purchase of RWF ${amount} for meter ${meterNumber} initiated. In a real application, this would process the purchase.`);
        
        // Reset form
        quickPurchaseForm.reset();
    });
    
    // Initialize preset amount buttons
    const presetButtons = document.querySelectorAll('.preset-amount');
    const amountInput = document.getElementById('powerAmount');
    
    if (presetButtons && amountInput) {
        presetButtons.forEach(button => {
            button.addEventListener('click', function() {
                presetButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const amount = this.getAttribute('data-amount');
                amountInput.value = amount;
            });
        });
    }
    
    // Initialize meter number lookup
    const lookupButton = document.getElementById('lookupButton');
    const meterInput = document.getElementById('meterNumber');
    const customerNameField = document.getElementById('customerName');
    
    if (lookupButton && meterInput && customerNameField) {
        lookupButton.addEventListener('click', function() {
            const meterNumber = meterInput.value;
            
            if (!meterNumber) {
                alert('Please enter a meter number');
                return;
            }
            
            // In a real application, you'd perform an API call to look up the customer
            // For demonstration, we'll just simulate a lookup
            setTimeout(() => {
                if (meterNumber.length === 8 && /^\d+$/.test(meterNumber)) {
                    customerNameField.value = 'John Doe';
                    customerNameField.classList.remove('not-found');
                    customerNameField.classList.add('found');
                } else {
                    customerNameField.value = 'Customer not found';
                    customerNameField.classList.remove('found');
                    customerNameField.classList.add('not-found');
                }
            }, 500);
        });
    }
}

// Show transaction details
function showTransactionDetails(transactionId) {
    // In a real application, you would fetch the transaction details from the API
    // For now, just show an alert
    alert(`Viewing details for transaction ${transactionId}`);
}

// These functions are duplicated from dashboard.js for modularity
// In a production environment, you might want to create a shared utilities file

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
            element.textContent = formatNumber(targetValue);
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