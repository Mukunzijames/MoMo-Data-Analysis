// Incoming Money page specific functions
function initializeIncomingMoney() {
    // Initialize counters
    animateCounter('totalIncoming', 2345);
    animateCounter('incomingAmount', 1248500);
    animateCounter('avgIncoming', 5324);
    
    // Initialize chart
    initializeIncomingChart();
    
    // Load sample incoming transactions
    loadIncomingTransactions();
    
    // Initialize date filters
    initializeDateFilters();
}

// Initialize incoming money chart
function initializeIncomingChart() {
    const ctx = document.getElementById('incomingChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Incoming Transactions',
                data: [150, 180, 210, 230, 280, 310, 350, 370, 320, 290, 260, 230],
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
                    text: 'Incoming Money Trends'
                }
            }
        }
    });
    
    // Initialize transaction source chart
    const sourceCtx = document.getElementById('sourceChart');
    if (!sourceCtx) return;
    
    const sourceChart = new Chart(sourceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Bank Transfers', 'Mobile Money', 'International Remittance', 'Other Sources'],
            datasets: [{
                data: [40, 35, 20, 5],
                backgroundColor: [
                    'rgba(0, 107, 134, 0.7)',
                    'rgba(255, 210, 0, 0.7)',
                    'rgba(255, 149, 0, 0.7)',
                    'rgba(108, 117, 125, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 107, 134, 1)',
                    'rgba(255, 210, 0, 1)',
                    'rgba(255, 149, 0, 1)',
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
                    text: 'Incoming Money Sources (%)'
                }
            }
        }
    });
}

// Load sample incoming transactions
function loadIncomingTransactions() {
    const tableBody = document.getElementById('incomingTableBody');
    if (!tableBody) return;
    
    const transactions = [
        { sender: 'John Doe', amount: 250000, date: '2023-06-15', source: 'Bank Transfer', status: 'success' },
        { sender: 'Jane Smith', amount: 150000, date: '2023-06-14', source: 'Mobile Money', status: 'success' },
        { sender: 'Robert Johnson', amount: 500000, date: '2023-06-13', source: 'International Remittance', status: 'pending' },
        { sender: 'Mary Williams', amount: 75000, date: '2023-06-12', source: 'Mobile Money', status: 'success' },
        { sender: 'David Brown', amount: 100000, date: '2023-06-11', source: 'Bank Transfer', status: 'failed' },
        { sender: 'Sarah Davis', amount: 300000, date: '2023-06-10', source: 'International Remittance', status: 'success' },
        { sender: 'Michael Wilson', amount: 125000, date: '2023-06-09', source: 'Mobile Money', status: 'success' },
        { sender: 'Elizabeth Taylor', amount: 200000, date: '2023-06-08', source: 'Bank Transfer', status: 'success' }
    ];
    
    let html = '';
    
    transactions.forEach(transaction => {
        html += `
            <tr>
                <td>${transaction.sender}</td>
                <td>RWF ${formatNumber(transaction.amount)}</td>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.source}</td>
                <td><span class="status status-${transaction.status}">${capitalizeFirstLetter(transaction.status)}</span></td>
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

// Initialize date filters
function initializeDateFilters() {
    const dateFilterSelect = document.getElementById('dateFilter');
    if (!dateFilterSelect) return;
    
    dateFilterSelect.addEventListener('change', function() {
        // Implement date filtering logic here
        console.log('Date filter changed to:', this.value);
        
        // For demonstration, we'll just show an alert
        alert(`Filter changed to: ${this.value}. In a real application, this would filter the data.`);
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