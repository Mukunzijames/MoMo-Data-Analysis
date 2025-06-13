document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const toastEl = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    const paymentModal = new bootstrap.Modal(document.getElementById('newPaymentModal'));
    
    // Sample payment data
    const payments = [
        {
            id: 'PAY-2023-001',
            date: '2023-06-15',
            codeHolder: 'Mukunzi Ndahiro James',
            amount: 1250.00,
            currency: 'USD',
            method: 'Bank Transfer',
            status: 'completed'
        },
        {
            id: 'PAY-2023-002',
            date: '2023-06-10',
            codeHolder: 'Alice Uwase',
            amount: 850.50,
            currency: 'EUR',
            method: 'PayPal',
            status: 'completed'
        },
        {
            id: 'PAY-2023-003',
            date: '2023-06-05',
            codeHolder: 'John Doe',
            amount: 2000.00,
            currency: 'GBP',
            method: 'Bank Transfer',
            status: 'pending'
        },
        {
            id: 'PAY-2023-004',
            date: '2023-06-01',
            codeHolder: 'Jane Smith',
            amount: 500000.00,
            currency: 'RWF',
            method: 'Bank Transfer',
            status: 'completed'
        },
        {
            id: 'PAY-2023-005',
            date: '2023-05-28',
            codeHolder: 'Mukunzi Ndahiro James',
            amount: 0.15,
            currency: 'USD',
            method: 'Crypto',
            status: 'completed'
        }
    ];
    
    // Initialize the page
    loadPayments();
    
    // Event listeners
    document.getElementById('newPaymentBtn').addEventListener('click', function() {
        // Set default date to today
        document.getElementById('paymentDate').valueAsDate = new Date();
        paymentModal.show();
    });
    
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitPayment();
    });
    
    document.getElementById('exportBtn').addEventListener('click', function() {
        exportPayments();
    });
    
    // Filter event listeners
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('currencyFilter').addEventListener('change', applyFilters);
    document.getElementById('methodFilter').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    
    // Functions
    function loadPayments() {
        const tbody = document.querySelector('#paymentsTable tbody');
        tbody.innerHTML = '';
        
        payments.forEach(payment => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${payment.id}</td>
                <td>${formatDate(payment.date)}</td>
                <td>${payment.codeHolder}</td>
                <td>${formatCurrency(payment.amount, payment.currency)}</td>
                <td><span class="currency-${payment.currency.toLowerCase()}">${payment.currency}</span></td>
                <td>${payment.method}</td>
                <td><span class="badge ${getStatusClass(payment.status)}">${capitalizeFirstLetter(payment.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-print"></i></button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Simple pagination (in a real app, this would be more complex)
        updatePagination();
    }
    
    function applyFilters() {
        const dateFilter = document.getElementById('dateFilter').value;
        const currencyFilter = document.getElementById('currencyFilter').value;
        const methodFilter = document.getElementById('methodFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        const filteredPayments = payments.filter(payment => {
            // Date filter
            if (dateFilter === 'thisMonth') {
                const paymentDate = new Date(payment.date);
                const today = new Date();
                if (paymentDate.getMonth() !== today.getMonth() || paymentDate.getFullYear() !== today.getFullYear()) {
                    return false;
                }
            } else if (dateFilter === 'lastMonth') {
                const paymentDate = new Date(payment.date);
                const today = new Date();
                let lastMonth = today.getMonth() - 1;
                let year = today.getFullYear();
                if (lastMonth < 0) {
                    lastMonth = 11;
                    year--;
                }
                if (paymentDate.getMonth() !== lastMonth || paymentDate.getFullYear() !== year) {
                    return false;
                }
            }
            
            // Currency filter
            if (currencyFilter !== 'all' && payment.currency !== currencyFilter) {
                return false;
            }
            
            // Method filter
            if (methodFilter !== 'all' && payment.method !== methodFilter) {
                return false;
            }
            
            // Search term
            if (searchTerm && !(
                payment.id.toLowerCase().includes(searchTerm) ||
                payment.codeHolder.toLowerCase().includes(searchTerm) ||
                payment.method.toLowerCase().includes(searchTerm)
            )) {
                return false;
            }
            
            return true;
        });
        
        updateTableWithFilteredPayments(filteredPayments);
    }
    
    function updateTableWithFilteredPayments(filteredPayments) {
        const tbody = document.querySelector('#paymentsTable tbody');
        tbody.innerHTML = '';
        
        filteredPayments.forEach(payment => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${payment.id}</td>
                <td>${formatDate(payment.date)}</td>
                <td>${payment.codeHolder}</td>
                <td>${formatCurrency(payment.amount, payment.currency)}</td>
                <td><span class="currency-${payment.currency.toLowerCase()}">${payment.currency}</span></td>
                <td>${payment.method}</td>
                <td><span class="badge ${getStatusClass(payment.status)}">${capitalizeFirstLetter(payment.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-print"></i></button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        updatePagination();
    }
    
    function submitPayment() {
        const codeHolder = document.getElementById('codeHolder').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const currency = document.getElementById('paymentCurrency').value;
        const date = document.getElementById('paymentDate').value;
        const method = document.getElementById('paymentMethod').value;
        const notes = document.getElementById('paymentNotes').value;
        
        // In a real app, you would send this to a server
        console.log('Submitting payment:', { codeHolder, amount, currency, date, method, notes });
        
        // Generate a new payment ID
        const newId = `PAY-${new Date().getFullYear()}-${(payments.length + 1).toString().padStart(3, '0')}`;
        
        // Add to payments (in a real app, this would come from the server response)
        const newPayment = {
            id: newId,
            date: date,
            codeHolder: document.getElementById('codeHolder').options[document.getElementById('codeHolder').selectedIndex].text,
            amount: amount,
            currency: currency,
            method: method,
            status: 'completed'
        };
        
        payments.unshift(newPayment);
        
        // Update the UI
        loadPayments();
        
        // Show success message
        toast.show();
        
        // Reset form and close modal
        document.getElementById('paymentForm').reset();
        paymentModal.hide();
    }
    
    function exportPayments() {
        // In a real app, this would generate a CSV or Excel file
        console.log('Exporting payments data');
        alert('Export functionality would generate a download file in a real application');
    }
    
    function updatePagination() {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = `
            <li class="page-item disabled">
                <a class="page-link" href="#" tabindex="-1">Previous</a>
            </li>
            <li class="page-item active"><a class="page-link" href="#">1</a></li>
            <li class="page-item"><a class="page-link" href="#">2</a></li>
            <li class="page-item"><a class="page-link" href="#">3</a></li>
            <li class="page-item">
                <a class="page-link" href="#">Next</a>
            </li>
        `;
    }
    
    // Helper functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function formatCurrency(amount, currency) {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    function getStatusClass(status) {
        switch(status) {
            case 'completed': return 'bg-success';
            case 'pending': return 'bg-warning text-dark';
            case 'failed': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
    
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});