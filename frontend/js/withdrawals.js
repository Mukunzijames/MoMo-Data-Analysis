// Withdrawals from Agents page specific functions
function initializeWithdrawals() {
    console.log('Initializing Withdrawals page...');
    // Initialize filter elements
    initializeWithdrawalsFilters();
    
    // Load data from API
    loadWithdrawalsData();
    
    // Initialize search radius value display
    const radiusSlider = document.getElementById('searchRadius');
    const radiusValue = document.getElementById('radiusValue');
    if (radiusSlider && radiusValue) {
        radiusValue.textContent = radiusSlider.value;
        radiusSlider.addEventListener('input', () => {
            radiusValue.textContent = radiusSlider.value;
        });
    }
}

// Load withdrawal statistics
async function loadWithdrawalStatistics() {
    try {
        const statsElement = document.querySelector('.stats-cards');
        if (!statsElement) return;
        
        UI.showLoading(statsElement);
        
        const statistics = await API.getWithdrawalStatistics();
        
        if (!statistics) {
            throw new Error('Failed to load statistics');
        }
        
        // Update statistics cards
        document.getElementById('totalWithdrawals').textContent = statistics.count || 0;
        document.getElementById('withdrawalAmount').textContent = UI.formatMoney(statistics.totalAmount || 0);
        document.getElementById('avgWithdrawal').textContent = UI.formatMoney(statistics.averageAmount || 0);
        
    } catch (error) {
        console.error('Error loading withdrawal statistics:', error);
        const statsElement = document.querySelector('.stats-cards');
        if (statsElement) {
            UI.showError(statsElement, 'Failed to load statistics');
        }
    }
}

// Load withdrawal transaction data from API
async function loadWithdrawalsData() {
    try {
        const response = await fetch('http://localhost:3000/api/withdrawals');
        const jsonData = await response.json();
        let data = jsonData.data;

        // If there's no API data available, use the mock data from the HTML table
        if (!data || !Array.isArray(data) || data.length === 0) {
            data = extractTableData();
        }

        // Update table with data
        updateWithdrawalsTable(data);
        
        // Update statistics
        updateWithdrawalsStatistics(data);

        // Initialize charts with table data
        initializeWithdrawalsCharts(data);

    } catch (error) {
        console.error('Error loading withdrawals data:', error);
        
        // Use table data as fallback
        const tableData = extractTableData();
        
        // Update statistics with table data
        updateWithdrawalsStatistics(tableData);
        
        // Initialize charts with table data
        initializeWithdrawalsCharts(tableData);
        
        // Show error message only if we couldn't extract table data
        if (!tableData.length) {
            const tableBody = document.getElementById('withdrawalsTableBody');
            tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
        }
    }
}

// Extract data from the existing HTML table
function extractTableData() {
    const tableBody = document.getElementById('withdrawalsTableBody');
    const data = [];
    
    if (!tableBody) return data;
    
    // Get all table rows except header
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Skip rows that have a colspan (usually error messages)
        if (cells.length === 5) {
            data.push({
                agent: cells[0].textContent.trim(),
                location: cells[1].textContent.trim(),
                amount: parseFloat(cells[2].textContent.replace('RWF', '').replace(/,/g, '').trim()),
                transactionDate: cells[3].textContent.trim(),
                status: cells[4].textContent.trim()
            });
        }
    });
    
    return data;
}

// Update withdrawal table
function updateWithdrawalsTable(data) {
    const tableBody = document.getElementById('withdrawalsTableBody');
    if (!tableBody || !data) return;
    
    tableBody.innerHTML = ''; // Clear previous rows
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');

        // Define status based on transaction status
        const status = item.status || 'Completed';
        
        // Define status class for styling
        const statusClass = status === 'Completed' ? 'status-success' : 
                           (status === 'Pending' ? 'status-pending' : 'status-failed');

        // Format date
        const date = item.transactionDate ? new Date(item.transactionDate).toLocaleString() : 'N/A';

        row.innerHTML = `
            <td>${item.agent || 'N/A'}</td>
            <td>${item.location || 'N/A'}</td>
            <td>${formatNumber(parseFloat(item.amount))} RWF</td>
            <td>${date}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
        `;

        tableBody.appendChild(row);
    });
    
    // Add CSS for status indicators if not already added
    addStatusStyles();
}

// Update withdrawals statistics with animation
function updateWithdrawalsStatistics(data) {
    if (!data || !Array.isArray(data)) {
        data = [];
    }
    
    // Calculate statistics
    const totalWithdrawals = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgWithdrawal = totalWithdrawals > 0 ? totalAmount / totalWithdrawals : 0;
    
    // Update UI with animation
    animateCounter('totalWithdrawals', totalWithdrawals);
    animateCounter('withdrawalAmount', totalAmount);
    animateCounter('avgWithdrawal', Math.round(avgWithdrawal));
    
    // Also add elements for failed and successful transactions statistics

}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('withdrawals-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'withdrawals-status-styles';
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
        .card {
            transition: all 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize withdrawals charts with data
function initializeWithdrawalsCharts(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Group data by location
    const locationData = {};
    data.forEach(item => {
        const location = item.location || 'Unknown';
        if (!locationData[location]) {
            locationData[location] = { 
                count: 0, 
                totalAmount: 0 
            };
        }
        locationData[location].count++;
        locationData[location].totalAmount += parseFloat(item.amount || 0);
    });
    
    // Group data by date (for monthly trend)
    const monthlyData = {};
    data.forEach(item => {
        if (!item.transactionDate) return;
        
        let dateKey;
        try {
            const date = new Date(item.transactionDate);
            dateKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        } catch (e) {
            return; // Skip if date parsing fails
        }
        
        if (!monthlyData[dateKey]) {
            monthlyData[dateKey] = { 
                count: 0, 
                totalAmount: 0 
            };
        }
        monthlyData[dateKey].count++;
        monthlyData[dateKey].totalAmount += parseFloat(item.amount || 0);
    });
    
    // Sort monthly data by date
    const sortedMonthlyLabels = Object.keys(monthlyData).sort();
    const sortedMonthlyCounts = sortedMonthlyLabels.map(key => monthlyData[key].count);
    const sortedMonthlyAmounts = sortedMonthlyLabels.map(key => monthlyData[key].totalAmount);
    
    // Format monthly labels to be more readable
    const formattedMonthlyLabels = sortedMonthlyLabels.map(key => {
        const [year, month] = key.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    
    // Monthly withdrawals chart
    const monthlyCtx = document.getElementById('withdrawalsChart');
    if (monthlyCtx) {
        const chart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: formattedMonthlyLabels,
                datasets: [{
                    label: 'Number of Withdrawals',
                    data: sortedMonthlyCounts,
                    backgroundColor: 'rgba(255, 149, 0, 0.2)',
                    borderColor: 'rgba(255, 149, 0, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
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
                            text: 'Number of Withdrawals'
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
                        text: 'Monthly Withdrawals Trend'
                    }
                }
            }
        });
    }
    
    // Amount trends chart
    const locationLabels = Object.keys(locationData);
    const locationAmounts = locationLabels.map(key => locationData[key].totalAmount);
    
    const amountCtx = document.getElementById('withdrawalAmountChart');
    if (amountCtx) {
        const amountChart = new Chart(amountCtx, {
            type: 'bar',
            data: {
                labels: locationLabels,
                datasets: [{
                    label: 'Total Amount (RWF)',
                    data: locationAmounts,
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
                            text: 'Amount (RWF)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Location'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Withdrawal Amounts by Location'
                    }
                }
            }
        });
    }
    
    // Agent distribution chart (using actual data)
    const locationCounts = locationLabels.map(key => locationData[key].count);
    
    const agentCtx = document.getElementById('agentDistributionChart');
    if (agentCtx) {
        const agentChart = new Chart(agentCtx, {
            type: 'doughnut',
            data: {
                labels: locationLabels,
                datasets: [{
                    data: locationCounts,
                    backgroundColor: [
                        'rgba(255, 149, 0, 0.7)',
                        'rgba(0, 107, 134, 0.7)',
                        'rgba(76, 175, 80, 0.7)',
                        'rgba(255, 210, 0, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 149, 0, 1)',
                        'rgba(0, 107, 134, 1)',
                        'rgba(76, 175, 80, 1)',
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
                        text: 'Withdrawals by Location'
                    }
                }
            }
        });
    }
}

// Initialize withdrawals filters
function initializeWithdrawalsFilters() {
    const dateFilterSelect = document.getElementById('withdrawalsDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            loadWithdrawalsData(); // Reload data
        });
    }
    
    const locationFilterSelect = document.getElementById('withdrawalsLocationFilter');
    if (locationFilterSelect) {
        locationFilterSelect.addEventListener('change', function() {
            loadWithdrawalsData(); // Reload data
        });
    }
}

// Show transaction details
function showTransactionDetails(transactionId) {
    // In a real application, you would fetch the transaction details from the API
    // For now, just show an alert
    alert(`Viewing details for transaction ${transactionId}`);
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
            element.textContent = formatNumber(Math.round(targetValue));
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
document.addEventListener('DOMContentLoaded', initializeWithdrawals); 