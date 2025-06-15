// Bank Transfers page specific functions
function initializeBankTransfers() {
    console.log('Initializing Bank Transfers page...');
    loadBankTransfersData();
}

async function loadBankTransfersData() {
    try {
        const response = await fetch('https://mo-mo-data-analysis.vercel.app/api/bank-transfers');
        const json = await response.json();

        const tableBody = document.getElementById('bankTransfersTableBody');
        tableBody.innerHTML = ''; // Clear previous data

        json.data.forEach(item => {
            const row = document.createElement('tr');
            
            // Define status based on transaction status
            const status = item.status || 'Completed';
            
            // Define status class for styling
            const statusClass = status === 'Completed' ? 'status-success' : 
                              (status === 'Pending' ? 'status-pending' : 'status-failed');

            row.innerHTML = `
                <td>${item.bankName || 'N/A'}</td>
                <td>${item.accountNumber || 'N/A'}</td>
                <td>${Number(item.amount).toLocaleString()} RWF</td>
                <td>${new Date(item.transactionDate).toLocaleString()}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updateBankTransfersStatistics(json.data);

    } catch (error) {
        console.error('Error fetching bank transfers:', error);
        const tableBody = document.getElementById('bankTransfersTableBody');
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

// Update bank transfers statistics
function updateBankTransfersStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransfers = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransfer = totalTransfers > 0 ? totalAmount / totalTransfers : 0;
    
    // Update UI if elements exist
    const totalBankTransfersEl = document.getElementById('totalBankTransfers');
    const bankTransferAmountEl = document.getElementById('bankTransferAmount');
    const avgBankTransferEl = document.getElementById('avgBankTransfer');
    
    if (totalBankTransfersEl) totalBankTransfersEl.textContent = totalTransfers;
    if (bankTransferAmountEl) bankTransferAmountEl.textContent = Number(totalAmount).toLocaleString();
    if (avgBankTransferEl) avgBankTransferEl.textContent = Number(Math.round(avgTransfer)).toLocaleString();
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('bank-transfers-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'bank-transfers-status-styles';
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
document.addEventListener('DOMContentLoaded', initializeBankTransfers);

// Initialize bank transfer charts
function initializeBankTransferCharts() {
    const ctx = document.getElementById('bankTransfersChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Number of Transfers',
                data: [28, 32, 35, 30, 38, 42, 36, 40, 45, 48, 43, 38],
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderColor: 'rgba(76, 175, 80, 1)',
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
                    text: 'Monthly Bank Transfers Trends'
                }
            }
        }
    });
    
    // Initialize bank distribution chart
    const bankCtx = document.getElementById('bankDistributionChart');
    if (!bankCtx) return;
    
    const bankChart = new Chart(bankCtx, {
        type: 'doughnut',
        data: {
            labels: ['Bank of Kigali', 'Equity Bank', 'I&M Bank', 'Access Bank', 'Other Banks'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(0, 107, 134, 0.7)',
                    'rgba(255, 149, 0, 0.7)',
                    'rgba(255, 210, 0, 0.7)',
                    'rgba(108, 117, 125, 0.7)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(0, 107, 134, 1)',
                    'rgba(255, 149, 0, 1)',
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
                    text: 'Transfers by Bank (%)'
                }
            }
        }
    });
    
    // Initialize amount trends chart
    const amountCtx = document.getElementById('bankTransferAmountChart');
    if (!amountCtx) return;
    
    const amountChart = new Chart(amountCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Total Amount (RWF)',
                data: [950000, 1050000, 1150000, 1000000, 1200000, 1250000, 1100000, 1180000, 1300000, 1350000, 1250000, 1150000],
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: 'rgba(76, 175, 80, 1)',
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
                    text: 'Transfer Amounts Trends'
                }
            }
        }
    });
}

// Initialize bank transfer filters
function initializeBankTransferFilters() {
    const dateFilterSelect = document.getElementById('bankTransfersDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            console.log('Date filter changed to:', this.value);
            // For demonstration, we'll just show an alert
            alert(`Filter changed to: ${this.value}. In a real application, this would filter the data.`);
        });
    }
    
    const bankFilterSelect = document.getElementById('bankFilter');
    if (bankFilterSelect) {
        bankFilterSelect.addEventListener('change', function() {
            console.log('Bank filter changed to:', this.value);
            // For demonstration, we'll just show an alert
            alert(`Bank filter changed to: ${this.value}. In a real application, this would filter the data.`);
        });
    }
}

// Mask account number for privacy
function maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
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