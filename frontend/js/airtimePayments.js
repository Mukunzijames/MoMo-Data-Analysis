// Airtime Bill Payments page specific functions
function initializeAirtimePayments() {
    console.log('Initializing Airtime Bill Payments page...');
    loadAirtimeData();
    initializeAirtimeCharts();
    initializeAirtimeFilters();
    initializeQuickPurchaseForm();
}

async function loadAirtimeData() {
    try {
        const response = await fetch('http://localhost:3000/api/airtime-bill-payments');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('airtimeTableBody');
        tableBody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');

            // Detect network from recipient or description
            const network = detectNetwork(item.recipient, item.description);
            
            // Define status based on transaction type
            const status = item.transactionType?.toLowerCase().includes('failed') ? 'Failed' : 'Success';
            
            // Define status class for styling
            const statusClass = status === 'Success' ? 'status-success' : 'status-failed';

            // Format date
            const date = new Date(item.transactionDate).toLocaleString();

            row.innerHTML = `
                <td>${item.recipient || 'N/A'}</td>
                <td>${network}</td>
                <td>${formatNumber(parseFloat(item.amount))} RWF</td>
                <td>${date}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updateAirtimeStatistics(data);

    } catch (error) {
        console.error('Error loading airtime data:', error);
    }
}

// Update airtime statistics
function updateAirtimeStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransactions = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Update UI if elements exist
    const totalAirtimeEl = document.getElementById('totalAirtime');
    const airtimeAmountEl = document.getElementById('airtimeAmount');
    const avgAirtimeEl = document.getElementById('avgAirtime');
    
    if (totalAirtimeEl) totalAirtimeEl.textContent = totalTransactions;
    if (airtimeAmountEl) airtimeAmountEl.textContent = formatNumber(totalAmount);
    if (avgAirtimeEl) avgAirtimeEl.textContent = formatNumber(Math.round(avgTransaction));
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

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('airtime-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'airtime-status-styles';
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

// Initialize filters
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
        const trendsResponse = await fetch('http://localhost:3000/api/airtime-bill-payments/trends');
        const trendsData = await trendsResponse.json();
        
        // Fetch top providers data
        const providersResponse = await fetch('http://localhost:3000/api/airtime-bill-payments/top-providers');
        const providersData = await providersResponse.json();
        
        // Fetch bill types data
        const billTypesResponse = await fetch('http://localhost:3000/api/airtime-bill-payments/bill-types');
        const billTypesData = await billTypesResponse.json();
        
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

// Initialize Monthly Airtime Purchases chart (line chart)
function initializeTransactionsChart(data) {
    const ctx = document.getElementById('airtimeChart');
    if (!ctx) return;
    
    // Prepare data for chart
    const labels = [];
    const amounts = [];
    const counts = [];
    
    // Process data from API or use empty arrays if no data
    if (data && data.length > 0) {
        // Sort data by date to ensure chronological order
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        data.forEach(item => {
            labels.push(formatMonthYear(item.date));
            amounts.push(item.totalAmount || 0);
            counts.push(item.transactionCount || 0);
        });
    }
    
    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Amount (RWF)',
                    data: amounts,
                    backgroundColor: 'rgba(255, 210, 0, 0.1)',
                    borderColor: 'rgba(255, 210, 0, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: true
                },
                {
                    label: 'Number of Purchases',
                    data: counts,
                    backgroundColor: 'rgba(0, 107, 134, 0.1)',
                    borderColor: 'rgba(0, 107, 134, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Total Amount (RWF)'
                    },
                    grid: {
                        display: false
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Number of Purchases'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Airtime Purchase Trends'
                }
            }
        }
    });
}

// Initialize Network Distribution chart (pie chart)
function initializeNetworkDistributionChart(data) {
    const ctx = document.getElementById('networkDistributionChart');
    if (!ctx) return;
    
    // Prepare data for chart
    const labels = [];
    const values = [];
    const backgroundColors = [
        'rgba(255, 210, 0, 0.7)',   // MTN yellow
        'rgba(220, 53, 69, 0.7)',    // Airtel red
        'rgba(0, 123, 255, 0.7)',    // Tigo blue
        'rgba(108, 117, 125, 0.7)'   // Others gray
    ];
    const borderColors = [
        'rgba(255, 210, 0, 1)',
        'rgba(220, 53, 69, 1)',
        'rgba(0, 123, 255, 1)',
        'rgba(108, 117, 125, 1)'
    ];
    
    // Process data from API or use placeholder data if empty
    if (data && data.length > 0) {
        data.forEach((item, index) => {
            labels.push(item.provider || 'Unknown');
            values.push(item.count || 0);
        });
    } else {
        // Placeholder data to show chart structure
        labels.push('MTN', 'Airtel', 'Tigo', 'Other');
        values.push(0, 0, 0, 0);
    }
    
    // Create the chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: borderColors.slice(0, labels.length),
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
                    text: 'Airtime Purchases by Network'
                }
            }
        }
    });
}

// Initialize Amount Distribution chart (bar chart)
function initializeAmountDistributionChart(data) {
    const ctx = document.getElementById('amountDistributionChart');
    if (!ctx) return;
    
    // Prepare data for chart
    const labels = [];
    const values = [];
    
    // Process data from API or use placeholder data if empty
    if (data && data.length > 0) {
        // Sort data by amount ranges
        data.sort((a, b) => {
            // Extract numeric value from range if possible
            const getVal = str => parseInt(str.match(/\d+/)[0] || 0);
            return getVal(a.amountRange) - getVal(b.amountRange);
        });
        
        data.forEach(item => {
            labels.push(item.amountRange || 'Unknown');
            values.push(item.count || 0);
        });
    } else {
        // Placeholder data to show chart structure
        labels.push('100-500', '501-1000', '1001-2000', '2001-5000', '5001+');
        values.push(0, 0, 0, 0, 0);
    }
    
    // Create the chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Transactions',
                data: values,
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
                        text: 'Count'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Amount Range (RWF)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Airtime Purchase Amount Distribution'
                }
            }
        }
    });
}

// Helper function to format date as Month Year (e.g., "Jan 2023")
function formatMonthYear(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
} 