// Incoming Money page specific functions
function initializeIncomingMoney() {
    console.log('Initializing Incoming Money page...');
    loadIncomingData();
    initializeDateFilters();
    // Initialize counters with animation
    document.querySelectorAll('.counter').forEach(counter => {
        animateCounter(counter.id, parseInt(counter.textContent) || 0);
    });
}

async function loadIncomingData() {
    try {
        const response = await fetch('http://localhost:3000/api/incoming-money');
        const json = await response.json();

        const tableBody = document.getElementById('incomingTableBody');
        tableBody.innerHTML = ''; // clear existing rows

        json.data.forEach(item => {
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
        
        // Add CSS for status indicators if not already added
        addStatusStyles();
        
        // Update statistics
        updateIncomingStatistics(json.data);
        
        // Initialize charts with the actual data
        initializeChartsWithData(json.data);

    } catch (error) {
        console.error('Failed to load incoming money data:', error);
        const tableBody = document.getElementById('incomingTableBody');
        tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
    }
}

// Update incoming money statistics
function updateIncomingStatistics(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Calculate statistics
    const totalTransactions = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Update UI if elements exist
    const totalIncomingEl = document.getElementById('totalIncoming');
    const incomingAmountEl = document.getElementById('incomingAmount');
    const avgIncomingEl = document.getElementById('avgIncoming');
    
    if (totalIncomingEl) totalIncomingEl.textContent = totalTransactions;
    if (incomingAmountEl) incomingAmountEl.textContent = Number(totalAmount).toLocaleString();
    if (avgIncomingEl) avgIncomingEl.textContent = Number(Math.round(avgTransaction)).toLocaleString();
    
    // Update quick stats based on real data
    updateQuickStats(data);
}

// Update quick stats section with real data
function updateQuickStats(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Find highest transaction
    const highestTransaction = Math.max(...data.map(item => parseFloat(item.amount || 0)));
    
    // Count sources to find most common
    const sourceCounts = {};
    data.forEach(item => {
        const source = item.source || 'Mobile Money';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    let mostCommonSource = 'N/A';
    let maxCount = 0;
    
    for (const [source, count] of Object.entries(sourceCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonSource = source;
        }
    }
    
    // Find peak day
    const dayCount = { 
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 
        'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0 
    };
    
    data.forEach(item => {
        const day = new Date(item.transactionDate).toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    let peakDay = 'N/A';
    maxCount = 0;
    
    for (const [day, count] of Object.entries(dayCount)) {
        if (count > maxCount) {
            maxCount = count;
            peakDay = day;
        }
    }
    
    // Find peak hour
    const hourCount = {};
    for (let i = 0; i < 24; i++) {
        hourCount[i] = 0;
    }
    
    data.forEach(item => {
        const hour = new Date(item.transactionDate).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    
    let peakHour = 0;
    maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCount)) {
        if (count > maxCount) {
            maxCount = count;
            peakHour = parseInt(hour);
        }
    }
    
    // Format peak hour range
    const peakHourStart = peakHour;
    const peakHourEnd = (peakHour + 2) % 24;
    const formatHour = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:00 ${period}`;
    };
    
    const peakTimeRange = `${formatHour(peakHourStart)} - ${formatHour(peakHourEnd)}`;
    
    // Update DOM elements
    const statsItems = document.querySelectorAll('.stat-item');
    if (statsItems.length >= 4) {
        // Highest Transaction
        const highestTransactionEl = statsItems[0].querySelector('.stat-value');
        if (highestTransactionEl) {
            highestTransactionEl.textContent = `RWF ${Number(highestTransaction).toLocaleString()}`;
        }
        
        // Most Common Source
        const mostCommonSourceEl = statsItems[1].querySelector('.stat-value');
        if (mostCommonSourceEl) {
            mostCommonSourceEl.textContent = mostCommonSource;
        }
        
        // Peak Day
        const peakDayEl = statsItems[2].querySelector('.stat-value');
        if (peakDayEl) {
            peakDayEl.textContent = peakDay;
        }
        
        // Peak Time
        const peakTimeEl = statsItems[3].querySelector('.stat-value');
        if (peakTimeEl) {
            peakTimeEl.textContent = peakTimeRange;
        }
    }
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

// Initialize charts with real data
function initializeChartsWithData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Process data for charts
    const processedData = processDataForCharts(data);
    
    // Initialize trend chart
    initializeTrendChart(processedData);
    
    // Initialize source chart
    initializeSourceChart(processedData);
}

// Process data for charts
function processDataForCharts(data) {
    // Group transactions by date
    const dateGroups = {};
    const sourceGroups = {};
    
    // Get date range for filtering
    const dateFilter = document.getElementById('dateFilter').value;
    const { startDate, endDate } = getDateRange(dateFilter);
    
    // Filter data by date range
    const filteredData = data.filter(item => {
        const transactionDate = new Date(item.transactionDate);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Group by date for trend chart
    filteredData.forEach(item => {
        const date = new Date(item.transactionDate);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = {
                count: 0,
                amount: 0
            };
        }
        
        dateGroups[dateKey].count += 1;
        dateGroups[dateKey].amount += parseFloat(item.amount || 0);
        
        // Group by source for source chart
        const source = item.source || 'Mobile Money';
        if (!sourceGroups[source]) {
            sourceGroups[source] = {
                count: 0,
                amount: 0
            };
        }
        
        sourceGroups[source].count += 1;
        sourceGroups[source].amount += parseFloat(item.amount || 0);
    });
    
    return {
        dateGroups,
        sourceGroups,
        dateFilter,
        startDate,
        endDate
    };
}

// Get date range based on filter
function getDateRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = new Date(today);
    let endDate = new Date(today);
    
    switch (filter) {
        case 'today':
            // Start and end are already today
            break;
        case 'yesterday':
            startDate.setDate(today.getDate() - 1);
            endDate = new Date(startDate);
            break;
        case 'last7days':
            startDate.setDate(today.getDate() - 6);
            break;
        case 'last30days':
            startDate.setDate(today.getDate() - 29);
            break;
        case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'lastMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'custom':
            // Custom date range would be handled by a date picker
            // For now, default to last 30 days
            startDate.setDate(today.getDate() - 29);
            break;
        default:
            startDate.setDate(today.getDate() - 29);
    }
    
    return { startDate, endDate };
}

// Initialize trend chart with real data
function initializeTrendChart(processedData) {
    const ctx = document.getElementById('incomingChart');
    if (!ctx) return;
    
    // Get sorted dates for x-axis
    const dateKeys = Object.keys(processedData.dateGroups).sort();
    
    // Format dates for display
    const formattedDates = dateKeys.map(dateKey => {
        const date = new Date(dateKey);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Get transaction counts and amounts for y-axis
    const transactionCounts = dateKeys.map(dateKey => processedData.dateGroups[dateKey].count);
    const transactionAmounts = dateKeys.map(dateKey => processedData.dateGroups[dateKey].amount);
    
    // Check if we already have a chart instance
    if (window.incomingTrendChart) {
        window.incomingTrendChart.destroy();
    }
    
    // Create new chart
    window.incomingTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [
                {
                    label: 'Transaction Count',
                    data: transactionCounts,
                    backgroundColor: 'rgba(0, 107, 134, 0.1)',
                    borderColor: 'rgba(0, 107, 134, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Transaction Amount (RWF)',
                    data: transactionAmounts,
                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                    borderColor: 'rgba(255, 149, 0, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Transaction Count'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Amount (RWF)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `Incoming Money Trends (${processedData.dateFilter})`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 1) {
                                label += 'RWF ' + Number(context.raw).toLocaleString();
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Initialize source chart with real data
function initializeSourceChart(processedData) {
    const sourceCtx = document.getElementById('sourceChart');
    if (!sourceCtx) return;
    
    // Get source data
    const sources = Object.keys(processedData.sourceGroups);
    const sourceCounts = sources.map(source => processedData.sourceGroups[source].count);
    const totalCount = sourceCounts.reduce((sum, count) => sum + count, 0);
    
    // Calculate percentages
    const sourcePercentages = sourceCounts.map(count => 
        totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    );
    
    // Generate colors
    const backgroundColors = [
        'rgba(0, 107, 134, 0.7)',
        'rgba(255, 210, 0, 0.7)',
        'rgba(255, 149, 0, 0.7)',
        'rgba(108, 117, 125, 0.7)',
        'rgba(40, 167, 69, 0.7)',
        'rgba(220, 53, 69, 0.7)',
        'rgba(111, 66, 193, 0.7)'
    ];
    
    const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));
    
    // Check if we already have a chart instance
    if (window.incomingSourceChart) {
        window.incomingSourceChart.destroy();
    }
    
    // Create new chart
    window.incomingSourceChart = new Chart(sourceCtx, {
        type: 'doughnut',
        data: {
            labels: sources,
            datasets: [{
                data: sourcePercentages,
                backgroundColor: backgroundColors.slice(0, sources.length),
                borderColor: borderColors.slice(0, sources.length),
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const count = sourceCounts[context.dataIndex] || 0;
                            return `${label}: ${value}% (${count} transactions)`;
                        }
                    }
                }
            }
        }
    });
}

// Initialize date filters
function initializeDateFilters() {
    const dateFilterSelect = document.getElementById('dateFilter');
    if (!dateFilterSelect) return;
    
    dateFilterSelect.addEventListener('change', function() {
        console.log('Date filter changed to:', this.value);
        
        // Reload data with new filter
        loadIncomingData();
    });
}

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