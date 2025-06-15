// Transfers to Mobile Numbers page specific functions
function initializeTransfersMobile() {
    // Initialize counters
    animateCounter('totalTransfers', 1845);
    animateCounter('transfersAmount', 1050000);
    animateCounter('avgTransfer', 5690);
    
    // Initialize charts
    initializeTransfersChart();
    
    // Load sample transfers data
    loadTransfersData();
    
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

// Load sample transfers data
function loadTransfersData() {
    const tableBody = document.getElementById('transfersTableBody');
    if (!tableBody) return;
    
    const transfers = [
        { recipient: '+250 78 123 4567', network: 'MTN', amount: 50000, date: '2023-06-15', status: 'success' },
        { recipient: '+250 73 234 5678', network: 'Airtel', amount: 75000, date: '2023-06-14', status: 'success' },
        { recipient: '+250 72 345 6789', network: 'Tigo', amount: 100000, date: '2023-06-13', status: 'pending' },
        { recipient: '+250 78 456 7890', network: 'MTN', amount: 25000, date: '2023-06-12', status: 'success' },
        { recipient: '+250 73 567 8901', network: 'Airtel', amount: 60000, date: '2023-06-11', status: 'failed' },
        { recipient: '+250 78 678 9012', network: 'MTN', amount: 45000, date: '2023-06-10', status: 'success' },
        { recipient: '+250 72 789 0123', network: 'Tigo', amount: 80000, date: '2023-06-09', status: 'success' },
        { recipient: '+250 78 890 1234', network: 'MTN', amount: 35000, date: '2023-06-08', status: 'pending' }
    ];
    
    let html = '';
    
    transfers.forEach(transfer => {
        let networkClass = '';
        switch(transfer.network) {
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
                <td>${transfer.recipient}</td>
                <td><span class="network-badge ${networkClass}">${transfer.network}</span></td>
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