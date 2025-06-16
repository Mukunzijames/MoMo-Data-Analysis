// Incoming Money page specific functions
function initializeIncomingMoney() {
    console.log('Initializing Incoming Money page...');
    loadIncomingData();
    setupSearchAndFilters();
}

// Store the original data to make filtering easier
let originalTransactionData = [];

async function loadIncomingData() {
    try {
        const response = await fetch('http://localhost:3000/api/incoming-money');
        const json = await response.json();
        
        // Store the original data
        originalTransactionData = json.data;

        // Update the table with the data
        updateTransactionTable(originalTransactionData);
        
        // Add CSS for status indicators if not already added
        addStatusStyles();

    } catch (error) {
        console.error('Failed to load incoming money data:', error);
        const tableBody = document.getElementById('incomingTableBody');
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

// Function to update the transaction table with filtered data
function updateTransactionTable(data) {
    const tableBody = document.getElementById('incomingTableBody');
    tableBody.innerHTML = ''; // clear existing rows
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No matching transactions found.</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');

        // Define status based on transaction type
        const status = item.status || 'Success';
        
        // Define status class for styling
        const statusClass = status === 'Success' ? 'status-success' : 'status-failed';

        row.innerHTML = `
            <td>${item.sender || 'N/A'}</td>
            <td>${Number(item.amount).toLocaleString()} RWF</td>
            <td>${new Date(item.transactionDate).toLocaleString()}</td>
            <td>${item.source || 'Mobile Money'}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
        `;

        tableBody.appendChild(row);
    });
}

// Set up search and filter functionality
function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const dateFilter = document.getElementById('dateFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    const statusFilter = document.getElementById('statusFilter');
    const applyFilters = document.getElementById('applyFilters');
    
    // Search functionality
    if (searchInput && searchBtn) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
        
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Filter functionality
    if (applyFilters) {
        applyFilters.addEventListener('click', applyAllFilters);
    }
}

// Perform search on transactions
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        updateTransactionTable(originalTransactionData);
        return;
    }
    
    const filteredData = originalTransactionData.filter(item => {
        // Search in multiple fields
        return (
            (item.sender && item.sender.toLowerCase().includes(searchTerm)) ||
            (item.amount && item.amount.toString().includes(searchTerm)) ||
            (item.source && item.source.toLowerCase().includes(searchTerm))
        );
    });
    
    updateTransactionTable(filteredData);
}

// Apply all selected filters
function applyAllFilters() {
    const dateFilter = document.getElementById('dateFilter').value;
    const sourceFilter = document.getElementById('sourceFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredData = [...originalTransactionData];
    
    // Apply date filter
    filteredData = filterByDate(filteredData, dateFilter);
    
    // Apply source filter
    if (sourceFilter !== 'all') {
        filteredData = filteredData.filter(item => {
            const source = item.source ? item.source.toLowerCase() : 'mobile money';
            
            switch(sourceFilter) {
                case 'mobileMoney':
                    return source.includes('mobile money');
                case 'bankTransfer':
                    return source.includes('bank');
                case 'international':
                    return source.includes('international') || source.includes('remittance');
                default:
                    return true;
            }
        });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredData = filteredData.filter(item => {
            const status = item.status ? item.status.toLowerCase() : 'success';
            return status === statusFilter.toLowerCase();
        });
    }
    
    updateTransactionTable(filteredData);
}

// Filter transactions by date range
function filterByDate(data, dateFilter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate;
    
    switch(dateFilter) {
        case 'today':
            startDate = today;
            break;
        case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 1);
            break;
        case 'last7days':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'last30days':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            break;
        case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'lastMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return data.filter(item => {
                const date = new Date(item.transactionDate);
                return date >= startDate && date <= endLastMonth;
            });
        case 'custom':
            // For custom date range, we'd typically have a date picker UI
            // For now, we'll just return all data
            return data;
        default:
            return data;
    }
    
    return data.filter(item => {
        const date = new Date(item.transactionDate);
        return date >= startDate;
    });
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('incoming-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'incoming-status-styles';
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

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeIncomingMoney); 