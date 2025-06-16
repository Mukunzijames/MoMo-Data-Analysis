// Payments to Code Holders page specific functions
let paymentsCodeData = []; // Store the data globally
let currentFilters = {
    dateRange: 'last30days',
    startDate: null,
    endDate: null,
    status: 'all',
    page: 1,
    limit: 10
};

function initializePaymentsCode() {
    console.log('Initializing Payments to Code Holders page...');
    
    // Set up event listeners for filter controls
    setupFilterListeners();
    
    // Load payments data with default filters
    loadPaymentsData();
}

function setupFilterListeners() {
    // Initialize with default values
    currentFilters.dateRange = document.getElementById('paymentsDateFilter').value;
    currentFilters.status = document.getElementById('paymentsStatusFilter').value;
    
    // Date range filter change
    const dateFilter = document.getElementById('paymentsDateFilter');
    dateFilter.addEventListener('change', function() {
        const selectedValue = this.value;
        
        // Show custom date inputs if custom is selected
        const customDateContainer = document.getElementById('customDateContainer');
        if (selectedValue === 'custom') {
            customDateContainer.style.display = 'flex';
        } else {
            customDateContainer.style.display = 'none';
            currentFilters.dateRange = selectedValue;
            // Auto-apply filter when selecting a preset date range
            if (document.getElementById('autoApplyFilters')?.checked) {
                document.getElementById('applyFilters').click();
            }
        }
    });
    
    // Status filter change with auto-apply
    const statusFilter = document.getElementById('paymentsStatusFilter');
    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        // Auto-apply filter when changing status
        if (document.getElementById('autoApplyFilters')?.checked) {
            document.getElementById('applyFilters').click();
        }
    });
    
    // Apply filters button
    const applyButton = document.getElementById('applyFilters');
    applyButton.addEventListener('click', function() {
        // Get date filter value
        const dateFilter = document.getElementById('paymentsDateFilter');
        currentFilters.dateRange = dateFilter.value;
        
        // If custom date range, get the start and end dates
        if (currentFilters.dateRange === 'custom') {
            currentFilters.startDate = document.getElementById('startDate').value;
            currentFilters.endDate = document.getElementById('endDate').value;
            
            // Validate custom date range
            if (!currentFilters.startDate || !currentFilters.endDate) {
                alert('Please select both start and end dates for custom range');
                return;
            }
        } else {
            currentFilters.startDate = null;
            currentFilters.endDate = null;
        }
        
        // Get status filter value
        const statusFilter = document.getElementById('paymentsStatusFilter');
        currentFilters.status = statusFilter.value;
        
        // Reset to page 1 when applying new filters
        currentFilters.page = 1;
        
        // Visual feedback
        const applyBtn = document.getElementById('applyFilters');
        const originalText = applyBtn.innerHTML;
        applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
        applyBtn.disabled = true;
        
        // Reload data with new filters
        loadPaymentsData().finally(() => {
            // Restore button state
            applyBtn.innerHTML = originalText;
            applyBtn.disabled = false;
        });
    });
    
    // Export button
    const exportButton = document.getElementById('exportData');
    exportButton.addEventListener('click', function() {
        // Visual feedback
        const exportBtn = this;
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
        exportBtn.disabled = true;
        
        // Export data
        exportPaymentsData()
            .finally(() => {
                // Restore button state
                setTimeout(() => {
                    exportBtn.innerHTML = originalText;
                    exportBtn.disabled = false;
                }, 1000);
            });
    });
    
    // View All button
    const viewAllButton = document.getElementById('viewAllPayments');
    viewAllButton.addEventListener('click', function() {
        // Set page size to a large number to see all records
        currentFilters.limit = 100;
        
        // Visual feedback
        const viewAllBtn = this;
        const originalText = viewAllBtn.innerHTML;
        viewAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        viewAllBtn.disabled = true;
        
        // Load all data
        loadPaymentsData()
            .finally(() => {
                // Restore button state
                viewAllBtn.innerHTML = originalText;
                viewAllBtn.disabled = false;
            });
    });
    
    // Initialize custom date inputs with sensible defaults if empty
    if (!document.getElementById('startDate').value) {
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        document.getElementById('startDate').value = formatDateForInput(lastMonth);
        document.getElementById('endDate').value = formatDateForInput(today);
    }
}

async function loadPaymentsData() {
    return new Promise(async (resolve, reject) => {
        try {
            // Show loading state
            const tableBody = document.getElementById('paymentsCodeTableBody');
            tableBody.innerHTML = '<tr><td colspan="5" class="loading-data"><i class="fas fa-spinner fa-spin"></i> Loading data...</td></tr>';
            
            // Prepare API parameters based on filters
            const params = {
                dateRange: currentFilters.dateRange,
                status: currentFilters.status,
                page: currentFilters.page,
                limit: currentFilters.limit
            };
            
            // Add custom date range if selected
            if (currentFilters.dateRange === 'custom' && currentFilters.startDate && currentFilters.endDate) {
                params.startDate = currentFilters.startDate;
                params.endDate = currentFilters.endDate;
            }
            
            // Simulate network delay for demo purposes (remove in production)
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Simulate API call (replace with actual API call when available)
            // const response = await API.getCodeHolderPayments(params);
            // For now, we'll use a mock API call
            const response = await fetch('http://localhost:3000/api/code-holder-payments');
            const jsonData = await response.json();
            const data = jsonData.data || [];
            
            // Store the data globally
            paymentsCodeData = data;
            
            // Filter the data based on status if needed
            let filteredData = data;
            if (currentFilters.status !== 'all') {
                filteredData = data.filter(item => {
                    const itemStatus = getTransactionStatus(item);
                    return itemStatus.toLowerCase() === currentFilters.status.toLowerCase();
                });
            }
            
            // Filter by date range if needed
            if (currentFilters.dateRange !== 'all') {
                // In a real application, this would be handled by the backend
                // Here we're just simulating the behavior
                console.log(`Filter applied: ${currentFilters.dateRange}`);
            }
            
            // Update the table with filtered data
            updatePaymentsTable(filteredData);
            
            // Calculate and update statistics
            updatePaymentsStatistics(filteredData);
            
            // Setup pagination if metadata is available
            // if (response.metadata) {
            //     API.renderPagination(response.metadata, 'paymentsPagination', changePage);
            // }
            
            resolve(filteredData);
        } catch (error) {
            console.error('Error fetching data:', error);
            const tableBody = document.getElementById('paymentsCodeTableBody');
            tableBody.innerHTML = '<tr><td colspan="5" class="error-message">Error loading data. Please try again.</td></tr>';
            reject(error);
        }
    });
}

function updatePaymentsTable(data) {
    const tableBody = document.getElementById('paymentsCodeTableBody');
    tableBody.innerHTML = ''; // Clear previous rows
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No payments found matching the selected filters.</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Define status based on totalSent and totalReceived
        const status = getTransactionStatus(item);
        
        // Add row content
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.phoneNumber || 'N/A'}</td>
            <td>RWF ${formatNumber(parseFloat(item.totalSent))}</td>
            <td>RWF ${formatNumber(parseFloat(item.totalReceived))}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updatePaymentsStatistics(data) {
    // Calculate total payments (count)
    const totalPayments = data.length;
    document.getElementById('totalPaymentsCode').textContent = totalPayments;
    
    // Calculate total amount (sum of all sent amounts)
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.totalSent), 0);
    document.getElementById('paymentsCodeAmount').textContent = formatNumber(totalAmount);
    
    // Calculate average payment
    const avgPayment = totalPayments > 0 ? totalAmount / totalPayments : 0;
    document.getElementById('avgPaymentCode').textContent = formatNumber(avgPayment.toFixed(2));
}

function getTransactionStatus(item) {
    const totalSent = parseFloat(item.totalSent);
    const totalReceived = parseFloat(item.totalReceived);
    
    if (totalReceived > totalSent) {
        return 'Profit';
    } else if (totalReceived < totalSent) {
        return 'Loss';
    } else {
        return 'Neutral';
    }
}

function changePage(pageNumber) {
    currentFilters.page = pageNumber;
    loadPaymentsData();
}

// Format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function exportPaymentsData() {
    return new Promise((resolve, reject) => {
        try {
            // Get current data
            const data = paymentsCodeData;
            
            if (!data || data.length === 0) {
                alert('No data to export.');
                return resolve();
            }
            
            // Create CSV content
            let csvContent = 'data:text/csv;charset=utf-8,';
            
            // Add headers
            csvContent += 'Name,Phone Number,Total Sent,Total Received,Status\n';
            
            // Add data rows
            data.forEach(item => {
                const status = getTransactionStatus(item);
                // Escape fields that might contain commas
                const escapeCsvField = field => {
                    if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
                        return `"${field.replace(/"/g, '""')}"`;
                    }
                    return field;
                };
                
                const row = [
                    escapeCsvField(item.name),
                    escapeCsvField(item.phoneNumber || 'N/A'),
                    item.totalSent,
                    item.totalReceived,
                    status
                ].join(',');
                csvContent += row + '\n';
            });
            
            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `payments-code-holders-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            
            setTimeout(resolve, 500); // Give browser time to initiate download
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data.');
            reject(error);
        }
    });
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status badges
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('payment-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'payment-status-styles';
    styleElement.textContent = `
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            text-align: center;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .profit {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            box-shadow: 0 2px 4px rgba(21, 87, 36, 0.1);
        }
        .loss {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            box-shadow: 0 2px 4px rgba(114, 28, 36, 0.1);
        }
        .neutral {
            background-color: #e2e3e5;
            color: #383d41;
            border: 1px solid #d6d8db;
            box-shadow: 0 2px 4px rgba(56, 61, 65, 0.1);
        }
        .filter-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
        }
        .filter-group {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .filter-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .filter-item label {
            margin-bottom: 0;
            font-weight: 500;
            white-space: nowrap;
        }
        .form-select {
            height: 38px;
            min-width: 160px;
            border-radius: 6px;
            border: 1px solid #ced4da;
            padding: 0.375rem 2.25rem 0.375rem 0.75rem;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 16px 12px;
        }
        #customDateContainer {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #customDateContainer label {
            margin-bottom: 0;
        }
        #customDateContainer input {
            width: 130px;
            height: 38px;
            border-radius: 6px;
            border: 1px solid #ced4da;
            padding: 0.375rem 0.75rem;
        }
        .apply-filters {
            padding: 8px 15px;
            background-color: #ffc107;
            color: #212529;
            border: none;
            font-weight: 500;
            border-radius: 6px;
        }
        .apply-filters:hover {
            background-color: #e0a800;
        }
        .export-btn button {
            padding: 8px 15px;
            background-color: white;
            color: #212529;
            border: 1px solid #ced4da;
            font-weight: 500;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .export-btn button:hover {
            background-color: #f8f9fa;
        }
        .loading-data {
            text-align: center;
            padding: 20px;
            color: #6c757d;
        }
        .error-message {
            text-align: center;
            padding: 20px;
            color: #721c24;
            background-color: #f8d7da;
        }
        .no-data {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            background-color: #f8f9fa;
        }
    `;
    document.head.appendChild(styleElement);
}

// Call the addStatusStyles function when the page loads
document.addEventListener('DOMContentLoaded', addStatusStyles); 