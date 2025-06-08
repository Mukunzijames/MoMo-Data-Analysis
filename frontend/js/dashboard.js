// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle.addEventListener('click', function() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.toggle('expanded');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    });
    
    // Close expanded sidebar when clicking outside (for mobile)
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 1024 && 
            sidebar.classList.contains('expanded') && 
            !sidebar.contains(event.target) && 
            event.target !== sidebarToggle) {
            sidebar.classList.remove('expanded');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('collapsed');
            if (window.innerWidth <= 576) {
                sidebar.classList.remove('expanded');
            }
        }
    });
    
    // Navigation menu item click
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Close sidebar on mobile after click
            if (window.innerWidth <= 576) {
                sidebar.classList.remove('expanded');
            }
        });
    });
    
    // Initialize counters
    animateCounter('totalTransactions', 1248);
    animateCounter('totalAmount', 7542350);
    animateCounter('avgTransaction', 6044);
    animateCounter('totalTypes', 10);
    
    // Initialize chart
    initializeChart();
    
    // Load sample transaction data
    loadSampleTransactions();
});

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

// Initialize chart
function initializeChart() {
    const ctx = document.getElementById('transactionChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Incoming', 'Payments', 'Transfers', 'Deposits', 'Airtime', 'Cash Power', 'Third Party', 'Withdrawals', 'Bank Transfers', 'Bundles'],
            datasets: [{
                label: 'Transaction Volume',
                data: [230, 156, 184, 95, 145, 132, 87, 99, 65, 55],
                backgroundColor: 'rgba(0, 107, 134, 0.7)',
                borderColor: 'rgba(0, 107, 134, 1)',
                borderWidth: 1
            }, {
                label: 'Transaction Amount (in thousands)',
                data: [1200, 850, 1050, 780, 250, 320, 600, 720, 950, 150],
                backgroundColor: 'rgba(255, 210, 0, 0.7)',
                borderColor: 'rgba(255, 210, 0, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Transaction Analysis by Category'
                }
            }
        }
    });
}

// Load sample transaction data
function loadSampleTransactions() {
    const tableBody = document.getElementById('transactionsTableBody');
    if (!tableBody) return;
    
    const transactions = [
        { type: 'Incoming Money', amount: 250000, date: '2023-06-15', status: 'success' },
        { type: 'Cash Power Payment', amount: 15000, date: '2023-06-14', status: 'success' },
        { type: 'Bank Transfer', amount: 500000, date: '2023-06-13', status: 'pending' },
        { type: 'Airtime Purchase', amount: 5000, date: '2023-06-12', status: 'success' },
        { type: 'Withdrawal', amount: 100000, date: '2023-06-11', status: 'failed' },
        { type: 'Mobile Transfer', amount: 75000, date: '2023-06-10', status: 'success' }
    ];
    
    let html = '';
    
    transactions.forEach(transaction => {
        html += `
            <tr>
                <td>${transaction.type}</td>
                <td>RWF ${formatNumber(transaction.amount)}</td>
                <td>${formatDate(transaction.date)}</td>
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

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
} 