// Airtime Bill Payments page specific functions
function initializeAirtimePayments() {
    console.log('Initializing Airtime Bill Payments page...');
    loadAirtimeData();
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