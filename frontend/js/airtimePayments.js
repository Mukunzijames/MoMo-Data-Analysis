// Airtime Bill Payments page specific functions
function initializeAirtimePayments() {
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
    initializeAirtimeFilters();
    
    // Initialize quick purchase form
    initializeQuickPurchaseForm();
}

// Fetch data and initialize the page
async function fetchAndInitializeData() {
    try {
        console.log('Fetching airtime payments data from API...');
        
        // Fetch statistics
        const statsResponse = await axios.get('http://127.0.0.1:5500/api/airtime-bill-payments/statistics');
        console.log('Airtime payments statistics response:', statsResponse);
        updateStatistics(statsResponse.data);
        
        // Fetch transaction data
        const airtimeResponse = await axios.get('http://127.0.0.1:5500/api/airtime-bill-payments');
        console.log('Airtime payments response:', airtimeResponse);
        loadAirtimeData(airtimeResponse.data);
        
        // Fetch data for charts
        await initializeAirtimeCharts();
    } catch (error) {
        console.error('Error fetching airtime payments data:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        showErrorNotification('Failed to load data. Please try again later.');
    }
}

// Update statistics on the page
function updateStatistics(stats) {
    if (!stats) return;
    
    // Update counters with real data
    animateCounter('totalAirtime', stats.count || 0);
    animateCounter('airtimeAmount', stats.totalAmount || 0);
    animateCounter('avgAirtime', stats.count > 0 ? Math.floor(stats.totalAmount / stats.count) : 0);
}

// Initialize airtime chart with real data
async function initializeAirtimeChart() {
    try {
        // Fetch providers data
        const providersResponse = await axios.get('/api/airtime-bill-payments/top-providers');
        const providers = providersResponse.data || [];
        
        // Fetch bill types data
        const billTypesResponse = await axios.get('/api/airtime-bill-payments/bill-types');
        const billTypes = billTypesResponse.data || [];
        
        // Initialize transactions chart
        initializeTransactionsChart();
        
        // Initialize network distribution chart
        initializeNetworkDistributionChart(providers);
        
        // Initialize amount distribution chart
        initializeAmountDistributionChart(billTypes);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        // Initialize charts with empty data
        initializeTransactionsChart();
        initializeNetworkDistributionChart([]);
        initializeAmountDistributionChart([]);
    }
}

// Initialize transactions chart
function initializeTransactionsChart(trendsData) {
    const ctx = document.getElementById('airtimeChart');
    if (!ctx) return;
    
    // For this chart, we'll use dummy data since we don't have monthly data from API
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Number of Transactions',
                data: trendsData || [110, 125, 135, 120, 145, 150, 130, 140, 155, 160, 145, 132],
                backgroundColor: 'rgba(0, 107, 134, 0.1)',
                borderColor: 'rgba(0, 107, 134, 1)',
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
                    text: 'Airtime Purchases Trends'
                }
            }
        }
    });
}

// Initialize network distribution chart
function initializeNetworkDistributionChart(providersData) {
    const networkCtx = document.getElementById('networkDistributionChart');
    if (!networkCtx) return;
    
    // Process providers data for chart
    let labels = [];
    let data = [];
    
    if (providersData.length > 0) {
        // Calculate total for percentages
        const total = providersData.reduce((sum, provider) => sum + (provider.frequency || 0), 0);
        
        // Get top 4 providers and group the rest as "Other Networks"
        const top4Providers = providersData.slice(0, 4);
        const otherProviders = providersData.slice(4);
        const otherProvidersTotal = otherProviders.reduce((sum, provider) => sum + (provider.frequency || 0), 0);
        
        // Create labels and data
        labels = top4Providers.map(provider => provider.provider || 'Unknown');
        data = top4Providers.map(provider => ((provider.frequency || 0) / total * 100).toFixed(1));
        
        // Add "Other Networks" if there are any
        if (otherProvidersTotal > 0) {
            labels.push('Other Networks');
            data.push((otherProvidersTotal / total * 100).toFixed(1));
        }
    } else {
        labels = ['MTN', 'Airtel', 'Tigo', 'Other Networks'];
        data = [50, 25, 20, 5]; // Default data if no real data available
    }
    
    const networkChart = new Chart(networkCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 210, 0, 0.7)',
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(0, 123, 255, 0.7)',
                    'rgba(108, 117, 125, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 210, 0, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(0, 123, 255, 1)',
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
                    text: 'Airtime by Network (%)'
                }
            }
        }
    });
}

// Initialize amount distribution chart
function initializeAmountDistributionChart(billTypesData) {
    const amountCtx = document.getElementById('amountDistributionChart');
    if (!amountCtx) return;
    
    // Process bill types data for chart
    let labels = [];
    let data = [];
    
    if (billTypesData.length > 0) {
        // Calculate total for percentages
        const total = billTypesData.reduce((sum, type) => sum + (type.frequency || 0), 0);
        
        // Get top 6 bill types and group the rest as "Other"
        const top6Types = billTypesData.slice(0, 6);
        const otherTypes = billTypesData.slice(6);
        const otherTypesTotal = otherTypes.reduce((sum, type) => sum + (type.frequency || 0), 0);
        
        // Create labels and data
        labels = top6Types.map(type => type.category || 'Unknown');
        data = top6Types.map(type => ((type.frequency || 0) / total * 100).toFixed(1));
        
        // Add "Other" if there are any
        if (otherTypesTotal > 0) {
            labels.push('Other');
            data.push((otherTypesTotal / total * 100).toFixed(1));
        }
    } else {
        labels = ['RWF 100', 'RWF 500', 'RWF 1,000', 'RWF 2,000', 'RWF 5,000', 'RWF 10,000+'];
        data = [10, 25, 30, 20, 10, 5]; // Default data if no real data available
    }
    
    const amountChart = new Chart(amountCtx, {
        type: 'pie',
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
                    text: 'Bill Types Distribution (%)'
                }
            }
        }
    });
}

// Load airtime payments data from API
function loadAirtimeData(response) {
    const tableBody = document.getElementById('airtimeTableBody');
    if (!tableBody) return;
    
    // Check if we have data and it's in the expected format
    if (!response || !response.data || !Array.isArray(response.data)) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    
    const payments = response.data;
    
    if (payments.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No payments found</td></tr>';
        return;
    }
    
    let html = '';
    
    payments.forEach(payment => {
        // Determine network based on recipient or description
        const network = detectNetwork(payment.recipient, payment.description);
        let networkClass = '';
        
        switch(network) {
            case 'MTN':
                networkClass = 'network-mtn';
                break;
            case 'Airtel':
                networkClass = 'network-airtel';
                break;
            case 'Tigo':
                networkClass = 'network-tigo';
                break;
            default:
                networkClass = 'network-other';
        }
        
        html += `
            <tr>
                <td>${payment.recipient || 'N/A'}</td>
                <td><span class="network-badge ${networkClass}">${network}</span></td>
                <td>RWF ${formatNumber(payment.amount || 0)}</td>
                <td>${formatDate(payment.transactionDate)}</td>
                <td><span class="status status-success">Completed</span></td>
                <td>
                    <button class="action-btn" onclick="viewPaymentDetails('${payment.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Detect network from recipient or description
function detectNetwork(recipient, description) {
    if (!recipient && !description) return 'Unknown';
    
    const text = (recipient || '') + ' ' + (description || '');
    
    if (/mtn|07[8-9]/.test(text.toLowerCase())) {
        return 'MTN';
    } else if (/airtel|07[23]/.test(text.toLowerCase())) {
        return 'Airtel';
    } else if (/tigo|07[56]/.test(text.toLowerCase())) {
        return 'Tigo';
    } else {
        return 'Other';
    }
}

// View payment details
function viewPaymentDetails(paymentId) {
    if (!paymentId) return;
    
    // Fetch payment details and show in a modal
    axios.get(`http://127.0.0.1:5500/api/airtime-bill-payments/${paymentId}`)
        .then(response => {
            const payment = response.data;
            showPaymentDetailsModal(payment);
        })
        .catch(error => {
            console.error('Error fetching payment details:', error);
            showErrorNotification('Failed to load payment details.');
        });
}

// Show payment details modal
function showPaymentDetailsModal(payment) {
    // Determine network based on recipient or description
    const network = detectNetwork(payment.recipient, payment.description);
    
    // Create modal HTML
    const modalHtml = `
        <div class="modal-backdrop"></div>
        <div class="modal">
            <div class="modal-header">
                <h2>Payment Details</h2>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="payment-details">
                    <p><strong>Recipient:</strong> ${payment.recipient || 'N/A'}</p>
                    <p><strong>Network:</strong> ${network}</p>
                    <p><strong>Amount:</strong> RWF ${formatNumber(payment.amount || 0)}</p>
                    <p><strong>Transaction Date:</strong> ${formatDate(payment.transactionDate)}</p>
                    <p><strong>Transaction ID:</strong> ${payment.transactionId || 'N/A'}</p>
                    <p><strong>Category:</strong> ${payment.category || 'N/A'}</p>
                    <p><strong>Description:</strong> ${payment.description || 'N/A'}</p>
                    <p><strong>Fee:</strong> RWF ${formatNumber(payment.fee || 0)}</p>
                    <p><strong>Balance After:</strong> RWF ${formatNumber(payment.balance || 0)}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'paymentModal';
    modalContainer.classList.add('modal-container');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Initialize airtime filters
function initializeAirtimeFilters() {
    const dateFilterSelect = document.getElementById('airtimeDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            const dateRange = this.value;
            applyFilters({ dateRange });
        });
    }
    
    const networkFilterSelect = document.getElementById('airtimeNetworkFilter');
    if (networkFilterSelect) {
        networkFilterSelect.addEventListener('change', function() {
            const network = this.value;
            applyFilters({ provider: network });
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
    axios.get(`http://127.0.0.1:5500/api/airtime-bill-payments?${queryString}`)
        .then(response => {
            loadAirtimeData(response);
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

// Initialize quick purchase form
function initializeQuickPurchaseForm() {
    const quickPurchaseForm = document.getElementById('quickPurchaseForm');
    if (!quickPurchaseForm) return;
    
    quickPurchaseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const phoneNumber = document.getElementById('phoneNumber').value;
        const amount = document.getElementById('airtimeAmount').value;
        const network = document.getElementById('networkSelect').value;
        
        // Show loading state
        const submitButton = quickPurchaseForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitButton.disabled = true;
        
        // In a real implementation, we would make an API call here
        // For now, we'll simulate a successful purchase after a delay
        setTimeout(() => {
            // Reset form and button
            quickPurchaseForm.reset();
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            
            // Show success message
            showSuccessNotification(`Airtime purchase of RWF ${amount} for ${phoneNumber} (${network}) was successful.`);
            
            // Refresh data
            fetchAndInitializeData();
        }, 1500);
    });
    
    // Initialize preset amount buttons
    const presetButtons = document.querySelectorAll('.preset-amount');
    if (presetButtons.length > 0) {
        presetButtons.forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                document.getElementById('airtimeAmount').value = amount;
            });
        });
    }
}

// Show success notification
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification', 'success');
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-check-circle"></i>
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

// Initialize airtime charts
async function initializeAirtimeCharts() {
    try {
        // Fetch monthly trends data
        const trendsResponse = await axios.get('http://127.0.0.1:5500/api/airtime-bill-payments/trends');
        const trendsData = trendsResponse.data || [];
        
        // Fetch top providers data
        const providersResponse = await axios.get('http://127.0.0.1:5500/api/airtime-bill-payments/top-providers');
        const providersData = providersResponse.data || [];
        
        // Fetch bill types data
        const billTypesResponse = await axios.get('http://127.0.0.1:5500/api/airtime-bill-payments/bill-types');
        const billTypesData = billTypesResponse.data || [];
        
        // Initialize transactions chart
        initializeTransactionsChart(trendsData);
        
        // Initialize network distribution chart
        initializeNetworkDistributionChart(providersData);
        
        // Initialize amount distribution chart
        initializeAmountDistributionChart(billTypesData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        // Initialize charts with empty data
        initializeTransactionsChart([]);
        initializeNetworkDistributionChart([]);
        initializeAmountDistributionChart([]);
    }
} 