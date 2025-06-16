// Internet and Voice Bundle Purchases page specific functions
function initializeInternetBundles() {
    console.log('Initializing Internet Bundles page...');
    // Load sample bundle data
    loadBundleData();
    
    // Initialize filters
    initializeBundleFilters();
    
    // Initialize bundle selection
    initializeBundleSelection();
}

// Load bundle data from API
async function loadBundleData() {
    try {
        const response = await fetch('http://localhost:3000/api/bundles');
        const json = await response.json();
        let data = json.data;
        
        // If there's no API data available, use the mock data from the HTML table
        if (!data || !Array.isArray(data) || data.length === 0) {
            data = extractTableData();
        }
        
        // Update table with data
        updateBundlesTable(data);
        
        // Update statistics
        updateBundleStatistics(data);
        
        // Initialize charts with table data
        initializeBundleCharts(data);
        
    } catch (error) {
        console.error('Error fetching bundles:', error);
        
        // Use table data as fallback
        const tableData = extractTableData();
        
        // Update statistics with table data
        updateBundleStatistics(tableData);
        
        // Initialize charts with table data
        initializeBundleCharts(tableData);
        
        // Show error message only if we couldn't extract table data
        if (!tableData.length) {
            const tableBody = document.getElementById('bundlesTableBody');
            tableBody.innerHTML = '<tr><td colspan="5">Failed to load data. Please try again later.</td></tr>';
        }
    }
}

// Extract data from the existing HTML table
function extractTableData() {
    const tableBody = document.getElementById('bundlesTableBody');
    const data = [];
    
    if (!tableBody) return data;
    
    // Get all table rows except header
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Skip rows that have a colspan (usually error messages)
        if (cells.length === 5) {
            data.push({
                phoneNumber: cells[0].textContent.trim(),
                bundleType: cells[1].textContent.trim(),
                amount: parseFloat(cells[2].textContent.replace('RWF', '').replace(/,/g, '').trim()),
                transactionDate: cells[3].textContent.trim(),
                status: cells[4].textContent.trim()
            });
        }
    });
    
    return data;
}

// Update bundles table with status badges
function updateBundlesTable(data) {
    const tableBody = document.getElementById('bundlesTableBody');
    if (!tableBody || !data) return;
    
    tableBody.innerHTML = ''; // Clear previous entries
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Define status based on transaction status
        const status = item.status || 'Successful';
        
        // Define status class for styling
        const statusClass = status === 'Successful' ? 'status-success' : 
                          (status === 'Pending' ? 'status-pending' : 'status-failed');

        // Format date
        const date = item.transactionDate ? new Date(item.transactionDate).toLocaleString() : 'N/A';

        row.innerHTML = `
            <td>${item.phoneNumber || 'N/A'}</td>
            <td>${item.bundleType || 'N/A'}</td>
            <td>${formatNumber(parseFloat(item.amount))} RWF</td>
            <td>${date}</td>
            <td><span class="status ${statusClass}">${status}</span></td>
        `;

        tableBody.appendChild(row);
    });
    
    // Add CSS for status indicators
    addStatusStyles();
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('bundles-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'bundles-status-styles';
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
        .network-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .network-badge.mtn {
            background-color: rgba(255, 210, 0, 0.2);
            color: #ff8c00;
        }
        .network-badge.airtel {
            background-color: rgba(255, 87, 51, 0.2);
            color: #e02020;
        }
        .network-badge.tigo {
            background-color: rgba(0, 107, 134, 0.2);
            color: #006b86;
        }
    `;
    document.head.appendChild(styleElement);
}

// Update bundle statistics with animation
function updateBundleStatistics(data) {
    if (!data || !Array.isArray(data)) {
        data = [];
    }
    
    // Calculate statistics
    const totalBundles = data.length;
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const avgBundle = totalBundles > 0 ? totalAmount / totalBundles : 0;
    
    // Update UI with animation
    animateCounter('totalBundles', totalBundles);
    animateCounter('bundleAmount', totalAmount);
    animateCounter('avgBundle', Math.round(avgBundle));
}

// Initialize bundle charts with real data
function initializeBundleCharts(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    
    // Group data by network (using the bundle type as a proxy for network for now)
    const networkData = {};
    data.forEach(item => {
        // Simple logic to determine network from phone number or bundle type
        let network = 'Other';
        if (item.phoneNumber) {
            if (item.phoneNumber.startsWith('07') || item.phoneNumber.toLowerCase().includes('mtn')) {
                network = 'MTN';
            } else if (item.phoneNumber.startsWith('073') || item.phoneNumber.toLowerCase().includes('airtel')) {
                network = 'Airtel';
            } else if (item.phoneNumber.startsWith('072') || item.phoneNumber.toLowerCase().includes('tigo')) {
                network = 'Tigo';
            }
        }
        
        if (!networkData[network]) {
            networkData[network] = { 
                count: 0, 
                totalAmount: 0 
            };
        }
        networkData[network].count++;
        networkData[network].totalAmount += parseFloat(item.amount || 0);
    });
    
    // Group data by bundle type
    const bundleTypeData = {};
    data.forEach(item => {
        const bundleType = item.bundleType || 'Other';
        if (!bundleTypeData[bundleType]) {
            bundleTypeData[bundleType] = { 
                count: 0, 
                totalAmount: 0 
            };
        }
        bundleTypeData[bundleType].count++;
        bundleTypeData[bundleType].totalAmount += parseFloat(item.amount || 0);
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
    
    // Monthly bundle purchases chart
    const ctx = document.getElementById('bundlesChart');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedMonthlyLabels,
                datasets: [{
                    label: 'Number of Purchases',
                    data: sortedMonthlyCounts,
                    backgroundColor: 'rgba(255, 87, 51, 0.1)',
                    borderColor: 'rgba(255, 87, 51, 1)',
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
                            text: 'Number of Purchases'
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
                        text: 'Monthly Bundle Purchases Trends'
                    }
                }
            }
        });
    }
    
    // Network distribution chart with real data
    const networkLabels = Object.keys(networkData);
    const networkCounts = networkLabels.map(key => networkData[key].count);
    const networkPercentages = networkCounts.map(count => (count / totalBundles * 100).toFixed(1));
    
    const networkCtx = document.getElementById('networkDistributionChart');
    if (networkCtx) {
        const networkChart = new Chart(networkCtx, {
            type: 'doughnut',
            data: {
                labels: networkLabels,
                datasets: [{
                    data: networkCounts,
                    backgroundColor: [
                        'rgba(255, 210, 0, 0.7)',
                        'rgba(255, 87, 51, 0.7)',
                        'rgba(0, 107, 134, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 210, 0, 1)',
                        'rgba(255, 87, 51, 1)',
                        'rgba(0, 107, 134, 1)',
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
                        text: 'Purchases by Network'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = (value / networkCounts.reduce((a, b) => a + b, 0) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Bundle type distribution chart with real data
    const bundleTypeLabels = Object.keys(bundleTypeData);
    const bundleTypeCounts = bundleTypeLabels.map(key => bundleTypeData[key].count);
    const bundlePercentages = bundleTypeCounts.map(count => (count / totalBundles * 100).toFixed(1));
    
    const bundleTypeCtx = document.getElementById('bundleTypeChart');
    if (bundleTypeCtx) {
        const bundleTypeChart = new Chart(bundleTypeCtx, {
            type: 'bar',
            data: {
                labels: bundleTypeLabels,
                datasets: [{
                    label: 'Count',
                    data: bundleTypeCounts,
                    backgroundColor: 'rgba(255, 87, 51, 0.7)',
                    borderColor: 'rgba(255, 87, 51, 1)',
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
                            text: 'Number of Purchases'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Bundle Type'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Bundle Types Distribution'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                const percentage = (value / bundleTypeCounts.reduce((a, b) => a + b, 0) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialize bundle filters
function initializeBundleFilters() {
    const dateFilterSelect = document.getElementById('bundlesDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            loadBundleData(); // Reload data with new filter
        });
    }
    
    const networkFilterSelect = document.getElementById('networkFilter');
    if (networkFilterSelect) {
        networkFilterSelect.addEventListener('change', function() {
            loadBundleData(); // Reload data with new filter
        });
    }
}

// Initialize bundle selection
function initializeBundleSelection() {
    const networkSelect = document.getElementById('networkSelect');
    const bundleTypeSelect = document.getElementById('bundleTypeSelect');
    const bundleOptionsContainer = document.getElementById('bundleOptions');
    
    if (!networkSelect || !bundleTypeSelect || !bundleOptionsContainer) return;
    
    const bundleOptions = {
        mtn: {
            data: [
                { name: 'Daily 100MB', price: 500, validity: '24 hours' },
                { name: 'Weekly 500MB', price: 1000, validity: '7 days' },
                { name: 'Monthly 2GB', price: 3000, validity: '30 days' },
                { name: 'Monthly 5GB', price: 5000, validity: '30 days' }
            ],
            voice: [
                { name: '30 Minutes', price: 500, validity: '24 hours' },
                { name: '60 Minutes', price: 1000, validity: '7 days' },
                { name: '120 Minutes', price: 2000, validity: '30 days' }
            ],
            'data-voice': [
                { name: '100MB + 30 Minutes', price: 1000, validity: '7 days' },
                { name: '500MB + 60 Minutes', price: 2000, validity: '30 days' },
                { name: '1GB + 120 Minutes', price: 3000, validity: '30 days' }
            ],
            social: [
                { name: 'WhatsApp Daily', price: 200, validity: '24 hours' },
                { name: 'Social Media Weekly', price: 500, validity: '7 days' },
                { name: 'All Social Media Monthly', price: 1000, validity: '30 days' }
            ]
        },
        airtel: {
            data: [
                { name: 'Daily 150MB', price: 500, validity: '24 hours' },
                { name: 'Weekly 600MB', price: 1000, validity: '7 days' },
                { name: 'Monthly 3GB', price: 3000, validity: '30 days' },
                { name: 'Monthly 6GB', price: 5000, validity: '30 days' }
            ],
            voice: [
                { name: '35 Minutes', price: 500, validity: '24 hours' },
                { name: '70 Minutes', price: 1000, validity: '7 days' },
                { name: '150 Minutes', price: 2000, validity: '30 days' }
            ],
            'data-voice': [
                { name: '150MB + 35 Minutes', price: 1000, validity: '7 days' },
                { name: '600MB + 70 Minutes', price: 2000, validity: '30 days' },
                { name: '1.5GB + 150 Minutes', price: 3000, validity: '30 days' }
            ],
            social: [
                { name: 'WhatsApp Daily', price: 200, validity: '24 hours' },
                { name: 'Social Media Weekly', price: 500, validity: '7 days' },
                { name: 'All Social Media Monthly', price: 1000, validity: '30 days' }
            ]
        },
        tigo: {
            data: [
                { name: 'Daily 120MB', price: 500, validity: '24 hours' },
                { name: 'Weekly 550MB', price: 1000, validity: '7 days' },
                { name: 'Monthly 2.5GB', price: 3000, validity: '30 days' },
                { name: 'Monthly 5.5GB', price: 5000, validity: '30 days' }
            ],
            voice: [
                { name: '32 Minutes', price: 500, validity: '24 hours' },
                { name: '65 Minutes', price: 1000, validity: '7 days' },
                { name: '130 Minutes', price: 2000, validity: '30 days' }
            ],
            'data-voice': [
                { name: '120MB + 30 Minutes', price: 1000, validity: '7 days' },
                { name: '550MB + 65 Minutes', price: 2000, validity: '30 days' },
                { name: '1.2GB + 130 Minutes', price: 3000, validity: '30 days' }
            ],
            social: [
                { name: 'WhatsApp Daily', price: 200, validity: '24 hours' },
                { name: 'Social Media Weekly', price: 500, validity: '7 days' },
                { name: 'All Social Media Monthly', price: 1000, validity: '30 days' }
            ]
        }
    };
    
    // Add event listeners to update options when network or bundle type changes
    networkSelect.addEventListener('change', updateBundleOptions);
    bundleTypeSelect.addEventListener('change', updateBundleOptions);
    
    function updateBundleOptions() {
        const network = networkSelect.value;
        const bundleType = bundleTypeSelect.value;
        
        // Clear previous content
        bundleOptionsContainer.innerHTML = '';
        
        // Hide the selection section initially
        document.getElementById('selectedBundleSection').style.display = 'none';
        
        // Check if both network and bundle type are selected
        if (!network || !bundleType) {
            bundleOptionsContainer.innerHTML = '<p>Please select both network and bundle type</p>';
            return;
        }
        
        // Check if options exist for this network and bundle type
        if (!bundleOptions[network] || !bundleOptions[network][bundleType]) {
            bundleOptionsContainer.innerHTML = '<p>No options available for this selection</p>';
            return;
        }
        
        // Create bundle options
        const options = bundleOptions[network][bundleType];
        const optionsList = document.createElement('div');
        optionsList.className = 'bundle-options-list';
        
        options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'bundle-option';
            optionElement.innerHTML = `
                <input type="radio" name="bundleOption" id="option${index}" value="${index}">
                <label for="option${index}">
                    <div class="option-name">${option.name}</div>
                    <div class="option-details">
                        <span class="option-price">RWF ${option.price.toLocaleString()}</span>
                        <span class="option-validity">Valid for ${option.validity}</span>
                    </div>
                </label>
            `;
            optionsList.appendChild(optionElement);
            
            // Add event listener to show selection when an option is clicked
            const radio = optionElement.querySelector(`#option${index}`);
            radio.addEventListener('change', function() {
                if (this.checked) {
                    // Show the selected bundle section
                    document.getElementById('selectedBundleSection').style.display = 'block';
                    
                    // Update the selected bundle information
                    document.getElementById('selectedBundleName').textContent = option.name;
                    document.getElementById('selectedBundlePrice').textContent = `RWF ${option.price.toLocaleString()}`;
                    
                    // Set the bundle amount
                    const bundleAmountInput = document.getElementById('bundleAmount');
                    if (bundleAmountInput) {
                        bundleAmountInput.value = option.price;
                    }
                }
            });
        });
        
        bundleOptionsContainer.appendChild(optionsList);
    }
    
    // Initialize the form submission handler
    const buyBundleForm = document.getElementById('buyBundleForm');
    if (buyBundleForm) {
        buyBundleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real application, you would send this data to the server
            alert('Your bundle purchase was successful!');
            
            // Reset the form
            this.reset();
            bundleOptionsContainer.innerHTML = '<p>Please select both network and bundle type</p>';
            document.getElementById('selectedBundleSection').style.display = 'none';
        });
    }
    
    // Initialize saved number buttons
    const buyBundleButtons = document.querySelectorAll('.saved-number .btn');
    buyBundleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const numberElement = this.closest('.saved-number').querySelector('.number');
            const phoneNumber = numberElement ? numberElement.textContent : '';
            
            const networkBadge = this.closest('.saved-number').querySelector('.network-badge');
            let network = '';
            
            if (networkBadge) {
                if (networkBadge.classList.contains('mtn')) network = 'mtn';
                else if (networkBadge.classList.contains('airtel')) network = 'airtel';
                else if (networkBadge.classList.contains('tigo')) network = 'tigo';
            }
            
            // Set values in the form
            if (phoneNumber && document.getElementById('phoneNumber')) {
                document.getElementById('phoneNumber').value = phoneNumber;
            }
            
            if (network && document.getElementById('networkSelect')) {
                document.getElementById('networkSelect').value = network;
                // Trigger the change event to update bundle options
                document.getElementById('networkSelect').dispatchEvent(new Event('change'));
            }
        });
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
            element.textContent = formatNumber(Math.round(targetValue));
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

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeInternetBundles); 