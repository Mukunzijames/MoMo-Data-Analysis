// Withdrawals from Agents page specific functions
function initializeWithdrawals() {
    // Initialize filter elements
    initializeWithdrawalsFilters();
    
    // Load data from API
    loadWithdrawalsData();
    
    // Load statistics
    loadWithdrawalStatistics();
    
    // Load agent data for charts
    loadAgentChartData();
}

// Load withdrawal statistics
async function loadWithdrawalStatistics() {
    try {
        const statsElement = document.querySelector('.stats-cards');
        if (!statsElement) return;
        
        UI.showLoading(statsElement);
        
        const statistics = await API.getWithdrawalStatistics();
        
        if (!statistics) {
            throw new Error('Failed to load statistics');
        }
        
        // Update statistics cards
        document.getElementById('totalWithdrawals').textContent = statistics.count || 0;
        document.getElementById('withdrawalAmount').textContent = UI.formatMoney(statistics.totalAmount || 0);
        document.getElementById('avgWithdrawal').textContent = UI.formatMoney(statistics.averageAmount || 0);
        
    } catch (error) {
        console.error('Error loading withdrawal statistics:', error);
        const statsElement = document.querySelector('.stats-cards');
        if (statsElement) {
            UI.showError(statsElement, 'Failed to load statistics');
        }
    }
}

// Load withdrawal transaction data from API
async function loadWithdrawalsData(page = 1) {
    try {
        const tableContainer = document.querySelector('.transactions-table');
        const tableBody = document.getElementById('withdrawalsTableBody');
        if (!tableBody || !tableContainer) return;
        
        UI.showLoading(tableContainer);
        
        // Get filter values
        const dateFilter = document.getElementById('withdrawalsDateFilter')?.value;
        const locationFilter = document.getElementById('withdrawalsLocationFilter')?.value;
        
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
        
        if (locationFilter && locationFilter !== 'all') {
            params.agent = locationFilter;
        }
        
        // Fetch transactions data from API
        const response = await API.getWithdrawalTransactions(params);
        
        if (!response || !response.data) {
            throw new Error('Failed to load transactions');
        }
        
        const { data: transactions, metadata } = response;
        
        // Render transactions table
        renderWithdrawalsTable(transactions, tableBody);
        
        // Render pagination
        const paginationContainer = document.getElementById('withdrawalsPagination');
        if (paginationContainer) {
            UI.renderPagination(metadata, 'withdrawalsPagination', (newPage) => {
                loadWithdrawalsData(newPage);
            });
        }
        
    } catch (error) {
        console.error('Error loading withdrawal transactions:', error);
        const tableContainer = document.querySelector('.transactions-table');
        if (tableContainer) {
            UI.showError(tableContainer, 'Failed to load transaction data');
        }
    }
}

// Render withdrawals table
function renderWithdrawalsTable(transactions, tableBody) {
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
                    <td>${transaction.agentName || 'Unknown Agent'}</td>
                    <td>${transaction.agentPhone || 'N/A'}</td>
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

// Load agent data for charts
async function loadAgentChartData() {
    try {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;
        
        UI.showLoading(chartContainer);
        
        // Get top agents
        const topAgents = await API.getTopAgents({ limit: 5 });
        
        // Initialize charts with real data
        initializeWithdrawalsCharts(topAgents);
        
    } catch (error) {
        console.error('Error loading chart data:', error);
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            UI.showError(chartContainer, 'Failed to load chart data');
        }
    }
}

// Initialize withdrawals charts with real data
function initializeWithdrawalsCharts(topAgents) {
    if (!topAgents || !topAgents.length) return;
    
    // Prepare data
    const agentNames = topAgents.map(agent => agent.agent);
    const transactionCounts = topAgents.map(agent => agent.frequency);
    const transactionAmounts = topAgents.map(agent => agent.totalAmount);
    
    // Withdrawals count chart
    const ctx = document.getElementById('withdrawalsChart');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: agentNames,
                datasets: [{
                    label: 'Number of Withdrawals',
                    data: transactionCounts,
                    backgroundColor: 'rgba(255, 149, 0, 0.7)',
                    borderColor: 'rgba(255, 149, 0, 1)',
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
                            text: 'Number of Withdrawals'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Agent'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Top Agents by Number of Withdrawals'
                    }
                }
            }
        });
    }
    
    // Amount trends chart
    const amountCtx = document.getElementById('withdrawalAmountChart');
    if (amountCtx) {
        const amountChart = new Chart(amountCtx, {
            type: 'bar',
            data: {
                labels: agentNames,
                datasets: [{
                    label: 'Total Amount (RWF)',
                    data: transactionAmounts,
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
                            text: 'Amount (RWF)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Agent'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Top Agents by Withdrawal Amount'
                    }
                }
            }
        });
    }
    
    // Agent distribution chart (placeholder with realistic regions)
    const regions = {
        'Kigali City': 40,
        'Northern Province': 20,
        'Southern Province': 15,
        'Eastern Province': 15,
        'Western Province': 10
    };
    
    const agentCtx = document.getElementById('agentDistributionChart');
    if (agentCtx) {
        const agentChart = new Chart(agentCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(regions),
                datasets: [{
                    data: Object.values(regions),
                    backgroundColor: [
                        'rgba(255, 149, 0, 0.7)',
                        'rgba(0, 107, 134, 0.7)',
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(255, 210, 0, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 149, 0, 1)',
                        'rgba(0, 107, 134, 1)',
                        'rgba(76, 175, 80, 1)',
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
                        text: 'Withdrawals by Region (%)'
                    }
                }
            }
        });
    }
}

// Initialize withdrawals filters
function initializeWithdrawalsFilters() {
    const dateFilterSelect = document.getElementById('withdrawalsDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            loadWithdrawalsData(1); // Reload data with page 1
        });
    }
    
    const locationFilterSelect = document.getElementById('withdrawalsLocationFilter');
    if (locationFilterSelect) {
        locationFilterSelect.addEventListener('change', function() {
            loadWithdrawalsData(1); // Reload data with page 1
        });
    }
}

// Show transaction details
function showTransactionDetails(transactionId) {
    // In a real application, you would fetch the transaction details from the API
    // For now, just show an alert
    alert(`Viewing details for transaction ${transactionId}`);
} 