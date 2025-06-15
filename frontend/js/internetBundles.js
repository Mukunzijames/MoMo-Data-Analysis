// Internet and Voice Bundle Purchases page specific functions
function initializeInternetBundles() {
    // Initialize counters
    animateCounter('totalBundles', 624);
    animateCounter('bundleAmount', 450000);
    animateCounter('avgBundle', 721);
    
    // Initialize charts
    initializeBundleCharts();
    
    // Load sample bundle data
    loadBundleData();
    
    // Initialize filters
    initializeBundleFilters();
    
    // Initialize bundle selection
    initializeBundleSelection();
}

// Initialize bundle charts
function initializeBundleCharts() {
    const ctx = document.getElementById('bundlesChart');
    if (!ctx) return;
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Number of Purchases',
                data: [48, 52, 58, 50, 62, 65, 55, 60, 68, 72, 64, 58],
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
    
    // Initialize network distribution chart
    const networkCtx = document.getElementById('networkDistributionChart');
    if (!networkCtx) return;
    
    const networkChart = new Chart(networkCtx, {
        type: 'doughnut',
        data: {
            labels: ['MTN', 'Airtel', 'Tigo', 'Other'],
            datasets: [{
                data: [45, 30, 20, 5],
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
                    text: 'Purchases by Network (%)'
                }
            }
        }
    });
    
    // Initialize bundle type distribution chart
    const bundleTypeCtx = document.getElementById('bundleTypeChart');
    if (!bundleTypeCtx) return;
    
    const bundleTypeChart = new Chart(bundleTypeCtx, {
        type: 'bar',
        data: {
            labels: ['Data', 'Voice', 'Data + Voice', 'Social Media', 'Other'],
            datasets: [{
                label: 'Percentage',
                data: [40, 25, 20, 10, 5],
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
                        text: 'Percentage (%)'
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
                }
            }
        }
    });
}

// Load bundle data from API
async function loadBundleData() {
    try {
        const response = await fetch('http://localhost:3000/api/bundles');
        const json = await response.json();

        const tableBody = document.getElementById('bundlesTableBody');
        tableBody.innerHTML = ''; // Clear previous entries

        json.data.forEach(item => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${item.phoneNumber || 'N/A'}</td>
                <td>${item.bundleType || 'N/A'}</td>
                <td>${Number(item.amount).toLocaleString()} RWF</td>
                <td>${new Date(item.transactionDate).toLocaleString()}</td>
                <td>Successful</td>
            `;

            tableBody.appendChild(row);
        });
        
        // Update statistics based on real data
        const totalBundles = json.data.length;
        const totalAmount = json.data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const avgBundle = totalBundles > 0 ? totalAmount / totalBundles : 0;
        
        // Update UI if elements exist
        const totalBundlesEl = document.getElementById('totalBundles');
        const bundleAmountEl = document.getElementById('bundleAmount');
        const avgBundleEl = document.getElementById('avgBundle');
        
        if (totalBundlesEl) totalBundlesEl.textContent = totalBundles;
        if (bundleAmountEl && bundleAmountEl.tagName !== 'INPUT') bundleAmountEl.textContent = Number(totalAmount).toLocaleString();
        if (avgBundleEl) avgBundleEl.textContent = Number(Math.round(avgBundle)).toLocaleString();
        
    } catch (error) {
        console.error('Error fetching bundles:', error);
        const tableBody = document.getElementById('bundlesTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7">Failed to load data. Please try again later.</td></tr>';
        }
    }
}

// Initialize bundle filters
function initializeBundleFilters() {
    const dateFilterSelect = document.getElementById('bundlesDateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.addEventListener('change', function() {
            console.log('Date filter changed to:', this.value);
            // For demonstration, we'll just show an alert
            alert(`Filter changed to: ${this.value}. In a real application, this would filter the data.`);
        });
    }
    
    const networkFilterSelect = document.getElementById('networkFilter');
    if (networkFilterSelect) {
        networkFilterSelect.addEventListener('change', function() {
            console.log('Network filter changed to:', this.value);
            // For demonstration, we'll just show an alert
            alert(`Network filter changed to: ${this.value}. In a real application, this would filter the data.`);
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
                { name: 'WhatsApp Bundle', price: 500, validity: '7 days' },
                { name: 'Social Media Bundle', price: 1000, validity: '30 days' }
            ]
        },
        airtel: {
            data: [
                { name: 'Daily 150MB', price: 500, validity: '24 hours' },
                { name: 'Weekly 600MB', price: 1000, validity: '7 days' },
                { name: 'Monthly 2.5GB', price: 3000, validity: '30 days' },
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
                { name: 'WhatsApp Bundle', price: 500, validity: '7 days' },
                { name: 'Social Media Bundle', price: 1000, validity: '30 days' }
            ]
        },
        tigo: {
            data: [
                { name: 'Daily 120MB', price: 500, validity: '24 hours' },
                { name: 'Weekly 550MB', price: 1000, validity: '7 days' },
                { name: 'Monthly 2.2GB', price: 3000, validity: '30 days' },
                { name: 'Monthly 5.5GB', price: 5000, validity: '30 days' }
            ],
            voice: [
                { name: '32 Minutes', price: 500, validity: '24 hours' },
                { name: '65 Minutes', price: 1000, validity: '7 days' },
                { name: '130 Minutes', price: 2000, validity: '30 days' }
            ],
            'data-voice': [
                { name: '120MB + 32 Minutes', price: 1000, validity: '7 days' },
                { name: '550MB + 65 Minutes', price: 2000, validity: '30 days' },
                { name: '1.2GB + 130 Minutes', price: 3000, validity: '30 days' }
            ],
            social: [
                { name: 'WhatsApp Bundle', price: 500, validity: '7 days' },
                { name: 'Social Media Bundle', price: 1000, validity: '30 days' }
            ]
        }
    };
    
    // Update bundle options when network or bundle type changes
    function updateBundleOptions() {
        const network = networkSelect.value;
        const bundleType = bundleTypeSelect.value;
        
        if (!network || !bundleType) {
            bundleOptionsContainer.innerHTML = '<p>Please select both network and bundle type</p>';
            return;
        }
        
        const options = bundleOptions[network][bundleType];
        if (!options || options.length === 0) {
            bundleOptionsContainer.innerHTML = '<p>No bundles available for this selection</p>';
            return;
        }
        
        let html = '<div class="bundle-options-grid">';
        options.forEach(option => {
            html += `
                <div class="bundle-option">
                    <div class="bundle-option-header">
                        <h4>${option.name}</h4>
                        <span class="bundle-price">RWF ${formatNumber(option.price)}</span>
                    </div>
                    <div class="bundle-option-body">
                        <div class="bundle-validity">Valid for ${option.validity}</div>
                        <button class="btn btn-outline btn-sm bundle-select" data-price="${option.price}">Select</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        bundleOptionsContainer.innerHTML = html;
        
        // Add event listeners to the bundle select buttons
        const bundleSelectButtons = bundleOptionsContainer.querySelectorAll('.bundle-select');
        bundleSelectButtons.forEach(button => {
            button.addEventListener('click', function() {
                const price = this.getAttribute('data-price');
                const bundleName = this.closest('.bundle-option').querySelector('h4').textContent;
                
                // Update the selected bundle info
                document.getElementById('selectedBundleName').textContent = bundleName;
                document.getElementById('selectedBundlePrice').textContent = `RWF ${formatNumber(price)}`;
                
                // Show the selected bundle section
                document.getElementById('selectedBundleSection').style.display = 'block';
                
                // Update the amount input field
                document.getElementById('bundleAmount').value = price;
            });
        });
    }
    
    networkSelect.addEventListener('change', updateBundleOptions);
    bundleTypeSelect.addEventListener('change', updateBundleOptions);
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

// Initialize when the document is ready
window.addEventListener('DOMContentLoaded', function() {
    initializeInternetBundles();
}); 