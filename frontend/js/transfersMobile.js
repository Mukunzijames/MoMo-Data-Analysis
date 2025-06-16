// Transfers to Mobile Numbers page specific functions
function initializeMobileTransfers() {
    // Initialize counters
    animateCounter('totalTransfers', 1845);
    animateCounter('transfersAmount', 1050000);
    animateCounter('avgTransfer', 5690);
    
    // Initialize charts
    initializeTransfersChart();
    
    // Load transfers data from API
    loadMobileTransfersData();
    
    // Initialize filters
    initializeTransfersFilters();
    
    // Initialize new transfer form
    initializeNewTransferForm();
}

// Initialize transfers chart
function initializeTransfersChart() {
    const ctx = document.getElementById('transfersChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Number of Transfers',
                data: [140, 155, 165, 150, 175, 180, 160, 170, 185, 190, 175, 162],
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
                        text: 'Number of Transfers'
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
                    text: 'Mobile Transfers Trends'
                }
            }
        }
    });
    
    // Initialize transfer network chart
    const networkCtx = document.getElementById('networkChart');
    if (!networkCtx) return;
    
    const networkChart = new Chart(networkCtx, {
        type: 'doughnut',
        data: {
            labels: ['MTN', 'Airtel', 'Tigo', 'Other Networks'],
            datasets: [{
                data: [45, 30, 20, 5],
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
                    text: 'Transfers by Network (%)'
                }
            }
        }
    });
}

// Load mobile transfers data
async function loadMobileTransfersData() {
    const tableBody = document.getElementById('transfersTableBody');
    if (!tableBody) return;

    try {
        const response = await fetch('http://localhost:3000/api/mobile-transfers');
        const json = await response.json();

        if (!json.data || !Array.isArray(json.data)) {
            throw new Error('Invalid data format received');
        }

        const transfers = json.data;
        
        // Clear existing content
        tableBody.innerHTML = '';

        if (transfers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No transfers found</td></tr>';
            return;
        }

        transfers.forEach(transfer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transfer.recipient || 'N/A'}</td>
                <td>${transfer.recipientPhone || 'N/A'}</td>
                <td>${transfer.amount || '0'}</td>
                <td>${new Date(transfer.transactionDate).toLocaleString()}</td>
                <td>${transfer.status || 'Success'}</td>
            `;
            tableBody.appendChild(row);
        });

        // Update statistics if data is available
        updateMobileTransfersStatistics(transfers);

    } catch (error) {
        console.error('Failed to load transfers:', error);
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

// Initialize transfers filters
function initializeTransfersFilters() {
    const dateFilterSelect = document.getElementById('transfersDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            console.log('Date filter changed to:', this.value);
            // For demonstration, we'll just show an alert
            alert(`Filter changed to: ${this.value}. In a real application, this would filter the data.`);
        });
    }
    
    const networkFilterSelect = document.getElementById('transfersNetworkFilter');
    if (networkFilterSelect) {
        networkFilterSelect.addEventListener('change', function() {
            console.log('Network filter changed to:', this.value);
            // For demonstration, we'll just show an alert
            alert(`Network filter changed to: ${this.value}. In a real application, this would filter the data.`);
        });
    }
}

// Initialize new transfer form
function initializeNewTransferForm() {
    const newTransferForm = document.getElementById('newTransferForm');
    if (!newTransferForm) return;
    
    newTransferForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const phoneNumber = document.getElementById('phoneNumber').value;
        const amount = document.getElementById('transferAmount').value;
        const network = document.getElementById('networkSelect').value;
        
        // For demonstration, we'll just show an alert
        alert(`Transfer of RWF ${amount} to ${phoneNumber} (${network}) initiated. In a real application, this would process the transfer.`);
        
        // Reset form
        newTransferForm.reset();
    });
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

// Update mobile transfers statistics
function updateMobileTransfersStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransfers = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransfer = totalTransfers > 0 ? totalAmount / totalTransfers : 0;
    
    // Update UI if elements exist
    const totalTransfersEl = document.getElementById('totalTransfers');
    const transfersAmountEl = document.getElementById('transfersAmount');
    const avgTransferEl = document.getElementById('avgTransfer');
    
    if (totalTransfersEl) totalTransfersEl.textContent = totalTransfers;
    if (transfersAmountEl) transfersAmountEl.textContent = Number(totalAmount).toLocaleString();
    if (avgTransferEl) avgTransferEl.textContent = Number(Math.round(avgTransfer)).toLocaleString();
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('transfers-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'transfers-status-styles';
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

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeMobileTransfers); 