// Bank Deposits page specific functions
function initializeBankDeposits() {
    // Load Axios if not already loaded
    if (!window.axios) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
        script.onload = function() {
            fetchAndInitializeData();
        };
        document.head.appendChild(script);
    } else {
        fetchAndInitializeData();
    }
    
    // Initialize filters
    initializeDepositsFilters();
}

// Fetch data and initialize the page
async function fetchAndInitializeData() {
    try {
        console.log('Fetching bank deposits data from API...');
        
        // Fetch statistics
        const statsResponse = await axios.get('http://127.0.0.1:5500/api/bank-deposits/statistics');
        console.log('Bank deposits statistics response:', statsResponse);
        updateStatistics(statsResponse.data);
        
        // Fetch transaction data
        const depositsResponse = await axios.get('http://127.0.0.1:5500/api/bank-deposits');
        console.log('Bank deposits response:', depositsResponse);
        loadDepositsData(depositsResponse.data);
        
        // Fetch data for charts
        await initializeDepositsChart();
    } catch (error) {
        console.error('Error fetching bank deposits data:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        showErrorNotification('Failed to load data. Please try again later.');
    }
}

// Update statistics on the page
function updateStatistics(stats) {
    if (!stats) return;
    
    // Update counters with real data
    animateCounter('totalDeposits', stats.count || 0);
    animateCounter('depositsAmount', stats.totalAmount || 0);
    animateCounter('avgDeposit', stats.count > 0 ? Math.floor(stats.totalAmount / stats.count) : 0);
}

// Initialize deposits chart with real data
async function initializeDepositsChart() {
    try {
        // Fetch monthly trends data
        const trendsResponse = await axios.get('http://127.0.0.1:5500/api/bank-deposits/trends');
        const trendsData = trendsResponse.data || [];
        
        // Fetch top banks data
        const topBanksResponse = await axios.get('http://127.0.0.1:5500/api/bank-deposits/top-banks');
        const topBanksData = topBanksResponse.data || [];
        
        // Initialize monthly deposits chart
        initializeMonthlyDepositsChart(trendsData);
        
        // Initialize bank distribution chart
        initializeBankDistributionChart(topBanksData);
        
        // Initialize amount trends chart
        initializeAmountTrendsChart(trendsData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        // Initialize charts with empty data
        initializeMonthlyDepositsChart([]);
        initializeBankDistributionChart([]);
        initializeAmountTrendsChart([]);
    }
}

// Initialize monthly deposits chart
function initializeMonthlyDepositsChart(trendsData) {
    const ctx = document.getElementById('depositsChart');
    if (!ctx) return;
    
    // Process trends data for chart
    let labels = [];
    let data = [];
    
    if (trendsData.length > 0) {
        // Sort by month
        trendsData.sort((a, b) => new Date(a.month + '-01') - new Date(b.month + '-01'));
        
        // Extract labels and data
        labels = trendsData.map(item => {
            const [year, month] = item.month.split('-');
            return getMonthName(parseInt(month));
        });
        data = trendsData.map(item => item.count || 0);
    } else {
        labels = ['No Data Available'];
        data = [0];
    }
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Deposits',
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
                        text: 'Number of Deposits'
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
                    text: 'Bank Deposits Trends'
                }
            }
        }
    });
}

// Initialize bank distribution chart
function initializeBankDistributionChart(topBanksData) {
    const bankCtx = document.getElementById('bankDistributionChart');
    if (!bankCtx) return;
    
    // Process top banks data for chart
    let labels = [];
    let data = [];
    
    if (topBanksData.length > 0) {
        // Calculate total for percentages
        const total = topBanksData.reduce((sum, bank) => sum + (bank.frequency || 0), 0);
        
        // Get top 5 banks and group the rest as "Other Banks"
        const top5Banks = topBanksData.slice(0, 5);
        const otherBanks = topBanksData.slice(5);
        const otherBanksTotal = otherBanks.reduce((sum, bank) => sum + (bank.frequency || 0), 0);
        
        // Create labels and data
        labels = top5Banks.map(bank => bank.bankName || 'Unknown Bank');
        data = top5Banks.map(bank => ((bank.frequency || 0) / total * 100).toFixed(1));
        
        // Add "Other Banks" if there are any
        if (otherBanksTotal > 0) {
            labels.push('Other Banks');
            data.push((otherBanksTotal / total * 100).toFixed(1));
        }
    } else {
        labels = ['No Data Available'];
        data = [100];
    }
    
    const bankChart = new Chart(bankCtx, {
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
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(108, 117, 125, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 107, 134, 1)',
                    'rgba(255, 210, 0, 1)',
                    'rgba(255, 149, 0, 1)',
                    'rgba(76, 175, 80, 1)',
                    'rgba(33, 150, 243, 1)',
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
                    text: 'Deposits by Bank (%)'
                }
            }
        }
    });
}

// Initialize amount trends chart
function initializeAmountTrendsChart(trendsData) {
    const amountCtx = document.getElementById('depositAmountChart');
    if (!amountCtx) return;
    
    // Process trends data for chart
    let labels = [];
    let data = [];
    
    if (trendsData.length > 0) {
        // Sort by month
        trendsData.sort((a, b) => new Date(a.month + '-01') - new Date(b.month + '-01'));
        
        // Extract labels and data
        labels = trendsData.map(item => {
            const [year, month] = item.month.split('-');
            return getMonthName(parseInt(month));
        });
        data = trendsData.map(item => item.totalAmount || 0);
    } else {
        labels = ['No Data Available'];
        data = [0];
    }
    
    const amountChart = new Chart(amountCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Amount (RWF)',
                data: data,
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
                    text: 'Deposit Amounts Trends'
                }
            }
        }
    });
}

// Load deposits data from API
function loadDepositsData(response) {
    const tableBody = document.getElementById('depositsTableBody');
    if (!tableBody) return;
    
    // Check if we have data and it's in the expected format
    if (!response || !response.data || !Array.isArray(response.data)) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    
    const deposits = response.data;
    
    if (deposits.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No deposits found</td></tr>';
        return;
    }
    
    let html = '';
    
    deposits.forEach(deposit => {
        // Extract bank name from description if available
        const bankName = extractBankName(deposit.description) || 'Unknown Bank';
        
        html += `
            <tr>
                <td>${bankName}</td>
                <td>${deposit.accountNumber || 'N/A'}</td>
                <td>RWF ${formatNumber(deposit.amount || 0)}</td>
                <td>${formatDate(deposit.transactionDate)}</td>
                <td><span class="status status-success">Completed</span></td>
                <td>
                    <button class="action-btn" onclick="viewDepositDetails('${deposit.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
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
        const match = description.match(pattern);
        if (match) {
            return match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
        }
    }
    
    return null;
}

// View deposit details
function viewDepositDetails(depositId) {
    if (!depositId) return;
    
    // Fetch deposit details and show in a modal
    axios.get(`http://127.0.0.1:5500/api/bank-deposits/${depositId}`)
        .then(response => {
            const deposit = response.data;
            showDepositDetailsModal(deposit);
        })
        .catch(error => {
            console.error('Error fetching deposit details:', error);
            showErrorNotification('Failed to load deposit details.');
        });
}

// Show deposit details modal
function showDepositDetailsModal(deposit) {
    // Extract bank name from description if available
    const bankName = extractBankName(deposit.description) || 'Unknown Bank';
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal-backdrop"></div>
        <div class="modal">
            <div class="modal-header">
                <h2>Deposit Details</h2>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="deposit-details">
                    <p><strong>Bank:</strong> ${bankName}</p>
                    <p><strong>Account Number:</strong> ${deposit.accountNumber || 'N/A'}</p>
                    <p><strong>Amount:</strong> RWF ${formatNumber(deposit.amount || 0)}</p>
                    <p><strong>Transaction Date:</strong> ${formatDate(deposit.transactionDate)}</p>
                    <p><strong>Transaction ID:</strong> ${deposit.transactionId || 'N/A'}</p>
                    <p><strong>Description:</strong> ${deposit.description || 'N/A'}</p>
                    <p><strong>Fee:</strong> RWF ${formatNumber(deposit.fee || 0)}</p>
                    <p><strong>Balance After:</strong> RWF ${formatNumber(deposit.balance || 0)}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'depositModal';
    modalContainer.classList.add('modal-container');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('depositModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Initialize deposits filters
function initializeDepositsFilters() {
    const dateFilterSelect = document.getElementById('depositsDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            const dateRange = this.value;
            applyFilters({ dateRange });
        });
    }
    
    const bankFilterSelect = document.getElementById('depositsBankFilter');
    if (bankFilterSelect) {
        bankFilterSelect.addEventListener('change', function() {
            const bank = this.value;
            applyFilters({ bank });
        });
    }
}

// Apply filters to data
function applyFilters(filters) {
    // Get current URL search params
    const searchParams = new URLSearchParams(window.location.search);
    
    // Update or add filter parameters
    Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
            searchParams.set(key, filters[key]);
        } else {
            searchParams.delete(key);
        }
    });
    
    // Build query string
    const queryString = searchParams.toString();
    
    // Reload data with filters
    axios.get(`http://127.0.0.1:5500/api/bank-deposits?${queryString}`)
        .then(response => {
            loadDepositsData(response);
        })
        .catch(error => {
            console.error('Error applying filters:', error);
            showErrorNotification('Failed to apply filters.');
        });
}

// Show error notification
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification', 'error');
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 5000);
}

// Helper function to get month name from month number
function getMonthName(monthNumber) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber - 1] || '';
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
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
} 