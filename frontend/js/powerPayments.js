// Cash Power Payments page specific functions
function initializePowerPayments() {
    console.log('Initializing Cash Power Payments page...');
    loadPowerPaymentsData();
    initializePowerCharts();
    initializePowerQuickPurchase();
}

async function loadPowerPaymentsData() {
    try {
        const response = await fetch('http://localhost:3000/api/cash-power');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('powerTableBody');
        tableBody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');

            // Define status based on transaction status
            const status = item.status || 'Successful';
            
            // Define status class for styling
            const statusClass = status === 'Successful' ? 'status-success' : 
                               (status === 'Pending' ? 'status-pending' : 'status-failed');

            // Format date
            const date = new Date(item.transactionDate).toLocaleString();

            row.innerHTML = `
                <td>${item.meterNumber || 'N/A'}</td>
                <td>${item.customerName || 'N/A'}</td>
                <td>${formatNumber(parseFloat(item.amount))} RWF</td>
                <td>${item.units || 'N/A'}</td>
                <td>${date}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updatePowerPaymentsStatistics(data);

    } catch (error) {
        console.error('Error loading cash power payments data:', error);
        const tableBody = document.getElementById('powerTableBody');
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data. Please try again later.</td></tr>';
    }
}

// Update cash power payments statistics
function updatePowerPaymentsStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransactions = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Update UI if elements exist
    const totalPowerEl = document.getElementById('totalPower');
    const powerAmountEl = document.getElementById('powerAmount');
    const avgPowerEl = document.getElementById('avgPower');
    
    if (totalPowerEl) totalPowerEl.textContent = totalTransactions;
    if (powerAmountEl) powerAmountEl.textContent = formatNumber(totalAmount);
    if (avgPowerEl) avgPowerEl.textContent = formatNumber(Math.round(avgTransaction));
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('power-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'power-status-styles';
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

// Initialize Cash Power charts
async function initializePowerCharts() {
    try {
        // Fetch monthly trends data
        const trendsResponse = await fetch('http://localhost:3000/api/cash-power/trends');
        const trendsData = await trendsResponse.json();
        
        // Fetch amount trends data
        const amountTrendsResponse = await fetch('http://localhost:3000/api/cash-power/amount-trends');
        const amountTrendsData = await amountTrendsResponse.json();
        
        // Fetch amount distribution data
        const distributionResponse = await fetch('http://localhost:3000/api/cash-power/distribution');
        const distributionData = await distributionResponse.json();
        
        // Initialize monthly purchases chart
        initializePowerChart(trendsData);
        
        // Initialize amount trends chart
        initializePowerAmountChart(amountTrendsData);
        
        // Initialize distribution chart
        initializePowerDistributionChart(distributionData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        // Initialize charts with empty data
        initializePowerChart([]);
        initializePowerAmountChart([]);
        initializePowerDistributionChart([]);
    }
}

// Initialize Monthly Cash Power Purchases chart (line chart)
function initializePowerChart(data) {
    const ctx = document.getElementById('powerChart');
    if (!ctx) return;
    
    // Prepare data for chart
    const labels = [];
    const counts = [];
    const amounts = [];
    
    // Process data from API or use empty arrays if no data
    if (data && data.length > 0) {
        // Sort data by date to ensure chronological order
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        data.forEach(item => {
            labels.push(formatMonthYear(item.date));
            counts.push(item.transactionCount || 0);
            amounts.push(item.totalAmount || 0);
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
                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                    borderColor: 'rgba(255, 149, 0, 1)',
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
                    text: 'Monthly Cash Power Purchase Trends'
                }
            }
        }
    });
}

// Initialize Amount Trends chart (line chart)
function initializePowerAmountChart(data) {
    const ctx = document.getElementById('powerAmountChart');
    if (!ctx) return;
    
    // Prepare data for chart
    const labels = [];
    const averageAmounts = [];
    const unitPrices = [];
    
    // Process data from API or use empty arrays if no data
    if (data && data.length > 0) {
        // Sort data by date to ensure chronological order
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        data.forEach(item => {
            labels.push(formatMonthYear(item.date));
            averageAmounts.push(item.averageAmount || 0);
            unitPrices.push(item.averageUnitPrice || 0);
        });
    }
    
    // Create the chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Average Purchase Amount (RWF)',
                    data: averageAmounts,
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Average Unit Price (RWF)',
                    data: unitPrices,
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }
            ]
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
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Cash Power Pricing Trends'
                }
            }
        }
    });
}

// Initialize Amount Distribution chart (bar chart)
function initializePowerDistributionChart(data) {
    const ctx = document.getElementById('powerDistributionChart');
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
        labels.push('1000-5000', '5001-10000', '10001-20000', '20001-50000', '50001+');
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
                    text: 'Cash Power Purchase Amount Distribution'
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

// Initialize quick purchase form
function initializePowerQuickPurchase() {
    const quickPurchaseForm = document.getElementById('quickPurchaseForm');
    if (!quickPurchaseForm) return;
    
    // Handle meter lookup
    const lookupButton = document.getElementById('lookupButton');
    if (lookupButton) {
        lookupButton.addEventListener('click', function() {
            const meterNumber = document.getElementById('meterNumber').value;
            if (!meterNumber) {
                alert('Please enter a meter number');
                return;
            }
            
            // Simulate meter lookup - In real app would call an API
            lookupButton.disabled = true;
            lookupButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                document.getElementById('customerName').value = 'John Doe'; // Simulated name
                lookupButton.disabled = false;
                lookupButton.innerHTML = 'Lookup';
            }, 1000);
        });
    }
    
    quickPurchaseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const meterNumber = document.getElementById('meterNumber').value;
        const amount = document.getElementById('powerAmount').value;
        
        // Show loading state
        const submitButton = quickPurchaseForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitButton.disabled = true;
        
        // In a real implementation, we would make an API call here
        // For now, we'll simulate a successful purchase after a delay
        setTimeout(() => {
            // Calculate simulated units - typically around 40 RWF per kWh
            const units = Math.round(amount / 40 * 10) / 10;
            
            // Reset form and button
            quickPurchaseForm.reset();
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
            
            // Show success message
            showSuccessNotification(`Cash Power purchase of RWF ${amount} for meter ${meterNumber} was successful. You received ${units} kWh.`);
            
            // Refresh data
            loadPowerPaymentsData();
        }, 1500);
    });
    
    // Initialize preset amount buttons
    const presetButtons = document.querySelectorAll('.preset-amount');
    if (presetButtons.length > 0) {
        presetButtons.forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                document.getElementById('powerAmount').value = amount;
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

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializePowerPayments); 