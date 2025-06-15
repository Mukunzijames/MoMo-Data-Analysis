// Third Party Transactions page specific functions
function initializeThirdParty() {
    // Initialize filter elements
    initializeThirdPartyFilters();
    
    // Load data from API
    loadThirdPartyData();
    
    // Load statistics
    loadThirdPartyStatistics();
    
    // Load vendor data for charts
    loadVendorChartData();
}

// Load third party statistics
async function loadThirdPartyStatistics() {
    try {
        const statsElement = document.querySelector('.statistics-container');
        if (!statsElement) return;
        
        UI.showLoading(statsElement);
        
        const statistics = await API.getThirdPartyStatistics();
        
        if (!statistics) {
            throw new Error('Failed to load statistics');
        }
        
        // Update statistics cards
        document.getElementById('totalThirdParty').textContent = statistics.count || 0;
        document.getElementById('thirdPartyAmount').textContent = UI.formatMoney(statistics.totalAmount || 0);
        document.getElementById('avgThirdParty').textContent = UI.formatMoney(statistics.averageAmount || 0);
        
    } catch (error) {
        console.error('Error loading third party statistics:', error);
        const statsElement = document.querySelector('.statistics-container');
        if (statsElement) {
            UI.showError(statsElement, 'Failed to load statistics');
        }
    }
}

// Load transaction data from API
async function loadThirdPartyData(page = 1) {
    try {
        const tableContainer = document.querySelector('.transactions-table');
        const tableBody = document.getElementById('thirdPartyTableBody');
        if (!tableBody || !tableContainer) return;
        
        UI.showLoading(tableContainer);
        
        // Get filter values
        const dateFilter = document.getElementById('thirdPartyDateFilter')?.value;
        const categoryFilter = document.getElementById('thirdPartyCategoryFilter')?.value;
        
        // Calculate date ranges based on filter
        let startDate, endDate;
        if (dateFilter) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0];
            
            if (dateFilter === 'today') {
                startDate = endDate;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                startDate = weekAgo.toISOString().split('T')[0];
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                startDate = monthAgo.toISOString().split('T')[0];
            } else if (dateFilter === 'year') {
                const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                startDate = yearAgo.toISOString().split('T')[0];
            }
        }
        
        // Prepare API parameters
        const params = {
            page,
            limit: 10,
            startDate,
            endDate
        };
        
        if (categoryFilter && categoryFilter !== 'all') {
            params.vendor = categoryFilter;
        }
        
        // Fetch transactions data from API
        const response = await API.getThirdPartyTransactions(params);
        
        if (!response || !response.data) {
            throw new Error('Failed to load transactions');
        }
        
        const { data: transactions, metadata } = response;
        
        // Render transactions table
        renderThirdPartyTransactionsTable(transactions, tableBody);
        
        // Render pagination
        UI.renderPagination(metadata, 'thirdPartyPagination', (newPage) => {
            loadThirdPartyData(newPage);
        });
        
    } catch (error) {
        console.error('Error loading third party transactions:', error);
        const tableContainer = document.querySelector('.transactions-table');
        if (tableContainer) {
            UI.showError(tableContainer, 'Failed to load transaction data');
        }
    }
}

// Render third party transactions table
function renderThirdPartyTransactionsTable(transactions, tableBody) {
    if (!transactions || !tableBody) return;
    
    let html = '';
    
    if (transactions.length === 0) {
        html = '<tr><td colspan="6" class="no-data">No transactions found</td></tr>';
    } else {
        transactions.forEach(transaction => {
            // Determine status based on if the transaction was successful
            const status = transaction.fee >= 0 ? 'success' : 'failed';
            
            html += `
                <tr>
                    <td>${transaction.vendor || 'Unknown'}</td>
                    <td><span class="category-badge">${transaction.externalId || 'N/A'}</span></td>
                    <td>RWF ${UI.formatMoney(transaction.amount)}</td>
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

// Load vendor data for charts
async function loadVendorChartData() {
    try {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;
        
        UI.showLoading(chartContainer);
        
        // Get top vendors
        const topVendors = await API.getTopVendors({ limit: 5 });
        
        // Get statistics
        const statistics = await API.getThirdPartyStatistics();
        
        // Initialize charts with real data
        initializeThirdPartyCharts(topVendors, statistics);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            UI.showError(chartContainer, 'Failed to load chart data');
        }
    }
}

// Initialize third party charts with real data
function initializeThirdPartyCharts(topVendors, statistics) {
    // Provider distribution chart
    const providerCtx = document.getElementById('providerDistributionChart');
    if (providerCtx && topVendors && topVendors.length) {
        // Extract labels and data from top vendors
        const labels = topVendors.map(vendor => vendor.vendor);
        const data = topVendors.map(vendor => vendor.totalAmount);
        
        const providerChart = new Chart(providerCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
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
                        text: 'Transactions by Vendor (Amount)'
                    }
                }
            }
        });
    }
    
    // Frequency chart
    const frequencyCtx = document.getElementById('thirdPartyChart');
    if (frequencyCtx && topVendors && topVendors.length) {
        const labels = topVendors.map(vendor => vendor.vendor);
        const data = topVendors.map(vendor => vendor.frequency);
        
        const frequencyChart = new Chart(frequencyCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Transactions',
                    data: data,
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
                            text: 'Vendor'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Top Vendors by Transaction Count'
                    }
                }
            }
        });
    }
    
    // Amount chart
    const amountCtx = document.getElementById('thirdPartyAmountChart');
    if (amountCtx && topVendors && topVendors.length) {
        const labels = topVendors.map(vendor => vendor.vendor);
        const data = topVendors.map(vendor => vendor.averageAmount);
        
        const amountChart = new Chart(amountCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Amount (RWF)',
                    data: data,
                    backgroundColor: 'rgba(255, 210, 0, 0.7)',
                    borderColor: 'rgba(255, 210, 0, 1)',
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
                            text: 'Vendor'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Average Transaction Amount by Vendor'
                    }
                }
            }
        });
    }
}

// Initialize third party filters
function initializeThirdPartyFilters() {
    const dateFilterSelect = document.getElementById('thirdPartyDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            loadThirdPartyData(1); // Reload data with page 1
        });
    }
    
    const categoryFilterSelect = document.getElementById('thirdPartyCategoryFilter');
    if (categoryFilterSelect) {
        categoryFilterSelect.addEventListener('change', function() {
            loadThirdPartyData(1); // Reload data with page 1
        });
    }
}

// Show transaction details
function showTransactionDetails(transactionId) {
    // In a real application, you would fetch the transaction details from the API
    // For now, just show an alert
    alert(`Viewing details for transaction ${transactionId}`);
} 