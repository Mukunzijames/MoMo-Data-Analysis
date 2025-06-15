// Payments to Code Holders page specific functions
function initializePaymentsCode() {
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
    initializePaymentsFilters();
}

// Fetch data and initialize the page
async function fetchAndInitializeData() {
    try {
        console.log('Fetching data from API...');
        
        // Fetch statistics
        const statsResponse = await axios.get('http://127.0.0.1:5500/api/code-holder-payments/statistics');
        console.log('Statistics response:', statsResponse);
        updateStatistics(statsResponse.data);
        
        // Fetch transaction data
        const paymentsResponse = await axios.get('http://127.0.0.1:5500/api/code-holder-payments');
        console.log('Payments response:', paymentsResponse);
        loadPaymentsCodeData(paymentsResponse.data);
        
        // Fetch data for charts
        await initializePaymentsCodeChart();
    } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        showErrorNotification('Failed to load data. Please try again later.');
    }
}

// Update statistics on the page
function updateStatistics(stats) {
    if (!stats) return;
    
    // Update counters with real data
    animateCounter('totalPaymentsCode', stats.totalContacts || 0);
    animateCounter('paymentsCodeAmount', stats.totalSent || 0);
    animateCounter('avgPaymentCode', stats.totalContacts > 0 ? Math.floor(stats.totalSent / stats.totalContacts) : 0);
}

// Initialize payments code chart with real data
async function initializePaymentsCodeChart() {
    try {
        // Fetch top recipients for chart data
        const topRecipientsResponse = await axios.get('http://127.0.0.1:5500/api/code-holder-payments/top-recipients');
        const topRecipients = topRecipientsResponse.data || [];
        
        // Prepare chart data
        const labels = topRecipients.map(recipient => recipient.name || 'Unknown');
        const transactionCounts = topRecipients.map(recipient => recipient.frequency || 0);
        const amounts = topRecipients.map(recipient => recipient.totalSent || 0);
        
        // Initialize transaction count chart
        initializeTransactionCountChart(labels, transactionCounts);
        
        // Initialize payment amounts chart
        initializePaymentAmountsChart(labels, amounts);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        // Initialize charts with empty data
        initializeTransactionCountChart([], []);
        initializePaymentAmountsChart([], []);
    }
}

// Initialize transaction count chart
function initializeTransactionCountChart(labels, data) {
    const ctx = document.getElementById('paymentsCodeChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['No Data Available'],
            datasets: [{
                label: 'Number of Transactions',
                data: data.length > 0 ? data : [0],
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
                        text: 'Recipients'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Top Recipients by Transaction Count'
                }
            }
        }
    });
}

// Initialize payment amounts chart
function initializePaymentAmountsChart(labels, data) {
    const amountsCtx = document.getElementById('paymentAmountsChart');
    if (!amountsCtx) return;
    
    const amountsChart = new Chart(amountsCtx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['No Data Available'],
            datasets: [{
                label: 'Total Amount (RWF)',
                data: data.length > 0 ? data : [0],
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
                        text: 'Recipients'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Top Recipients by Amount'
                }
            }
        }
    });
}

// Load payments code data from API
function loadPaymentsCodeData(response) {
    const tableBody = document.getElementById('paymentsCodeTableBody');
    if (!tableBody) return;
    
    // Check if we have data and it's in the expected format
    if (!response || !response.data || !Array.isArray(response.data)) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    
    const contacts = response.data;
    
    if (contacts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No contacts found</td></tr>';
        return;
    }
    
    let html = '';
    
    contacts.forEach(contact => {
        html += `
            <tr>
                <td>${contact.name || 'N/A'}</td>
                <td>${contact.phoneNumber || 'N/A'}</td>
                <td>RWF ${formatNumber(contact.totalSent || 0)}</td>
                <td>${formatDate(contact.lastTransactionDate) || 'N/A'}</td>
                <td><span class="status status-success">Active</span></td>
                <td>
                    <button class="action-btn" onclick="viewContactDetails(${contact.id})">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// View contact details
function viewContactDetails(contactId) {
    if (!contactId) return;
    
    // Fetch contact details and show in a modal
    axios.get(`http://127.0.0.1:5500/api/code-holder-payments/${contactId}`)
        .then(response => {
            const contact = response.data;
            showContactDetailsModal(contact);
        })
        .catch(error => {
            console.error('Error fetching contact details:', error);
            showErrorNotification('Failed to load contact details.');
        });
}

// Show contact details modal
function showContactDetailsModal(contact) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal-backdrop"></div>
        <div class="modal">
            <div class="modal-header">
                <h2>Contact Details</h2>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="contact-details">
                    <p><strong>Name:</strong> ${contact.name || 'N/A'}</p>
                    <p><strong>Phone Number:</strong> ${contact.phoneNumber || 'N/A'}</p>
                    <p><strong>Total Transactions:</strong> ${contact.transactionCount || 0}</p>
                    <p><strong>Total Sent:</strong> RWF ${formatNumber(contact.totalSent || 0)}</p>
                    <p><strong>Total Received:</strong> RWF ${formatNumber(contact.totalReceived || 0)}</p>
                    <p><strong>Last Transaction:</strong> ${formatDate(contact.lastTransactionDate) || 'N/A'}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'contactModal';
    modalContainer.classList.add('modal-container');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Initialize payments filters
function initializePaymentsFilters() {
    const dateFilterSelect = document.getElementById('paymentsDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            const dateRange = this.value;
            applyFilters({ dateRange });
        });
    }
    
    const statusFilterSelect = document.getElementById('paymentsStatusFilter');
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', function() {
            const status = this.value;
            applyFilters({ status });
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
    axios.get(`http://127.0.0.1:5500/api/code-holder-payments?${queryString}`)
        .then(response => {
            loadPaymentsCodeData(response);
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
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
} 