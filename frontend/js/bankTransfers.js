// Bank Transfers page specific functions
function initializeBankTransfers() {
    // Initialize counters
    animateCounter('totalBankTransfers', 356);
    animateCounter('bankTransferAmount', 1250000);
    animateCounter('avgBankTransfer', 3511);
    
    // Initialize charts
    initializeBankTransferCharts();
    
    // Load sample bank transfers data
    loadBankTransfersData();
    
    // Initialize filters
    initializeBankTransferFilters();
}

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

// Load sample bank transfers data
function loadBankTransfersData() {
    const tableBody = document.getElementById('bankTransfersTableBody');
    if (!tableBody) return;
    
    const transfers = [
        { bank: 'Bank of Kigali', accountNumber: '1234567890', amount: 150000, date: '2023-06-15', status: 'success' },
        { bank: 'Equity Bank', accountNumber: '2345678901', amount: 75000, date: '2023-06-14', status: 'success' },
        { bank: 'I&M Bank', accountNumber: '3456789012', amount: 200000, date: '2023-06-13', status: 'pending' },
        { bank: 'Access Bank', accountNumber: '4567890123', amount: 100000, date: '2023-06-12', status: 'success' },
        { bank: 'Bank of Kigali', accountNumber: '5678901234', amount: 50000, date: '2023-06-11', status: 'failed' },
        { bank: 'Equity Bank', accountNumber: '6789012345', amount: 125000, date: '2023-06-10', status: 'success' },
        { bank: 'I&M Bank', accountNumber: '7890123456', amount: 80000, date: '2023-06-09', status: 'success' },
        { bank: 'Access Bank', accountNumber: '8901234567', amount: 175000, date: '2023-06-08', status: 'pending' }
    ];
    
    let html = '';
    
    transfers.forEach(transfer => {
        html += `
            <tr>
                <td>${transfer.bank}</td>
                <td>${maskAccountNumber(transfer.accountNumber)}</td>
                <td>RWF ${formatNumber(transfer.amount)}</td>
                <td>${formatDate(transfer.date)}</td>
                <td><span class="status status-${transfer.status}">${capitalizeFirstLetter(transfer.status)}</span></td>
                <td>
                    <button class="action-btn">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
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