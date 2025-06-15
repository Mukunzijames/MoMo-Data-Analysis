// Withdrawals from Agents page specific functions
function initializeWithdrawals() {
    console.log('Initializing Withdrawals page...');
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
async function loadWithdrawalsData() {
    try {
        const response = await fetch('https://mo-mo-data-analysis.vercel.app/api/withdrawals');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('withdrawalsTableBody');
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
                <td>${item.agent || 'N/A'}</td>
                <td>${item.location || 'N/A'}</td>
                <td>${formatNumber(parseFloat(item.amount))} RWF</td>
                <td>${date}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updateWithdrawalsStatistics(data);

    } catch (error) {
        console.error('Error loading withdrawals data:', error);
        const tableBody = document.getElementById('withdrawalsTableBody');
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

// Update withdrawals statistics
function updateWithdrawalsStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalWithdrawals = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgWithdrawal = totalWithdrawals > 0 ? totalAmount / totalWithdrawals : 0;
    
    // Update UI if elements exist
    const totalWithdrawalsEl = document.getElementById('totalWithdrawals');
    const withdrawalAmountEl = document.getElementById('withdrawalAmount');
    const avgWithdrawalEl = document.getElementById('avgWithdrawal');
    
    if (totalWithdrawalsEl) totalWithdrawalsEl.textContent = totalWithdrawals;
    if (withdrawalAmountEl) withdrawalAmountEl.textContent = formatNumber(totalAmount);
    if (avgWithdrawalEl) avgWithdrawalEl.textContent = formatNumber(Math.round(avgWithdrawal));
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('withdrawals-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'withdrawals-status-styles';
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
            loadWithdrawalsData(); // Reload data
        });
    }
    
    const locationFilterSelect = document.getElementById('withdrawalsLocationFilter');
    if (locationFilterSelect) {
        locationFilterSelect.addEventListener('change', function() {
            loadWithdrawalsData(); // Reload data
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
document.addEventListener('DOMContentLoaded', initializeWithdrawals); 