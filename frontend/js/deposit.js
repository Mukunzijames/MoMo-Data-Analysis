document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const toastEl = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    const depositModal = new bootstrap.Modal(document.getElementById('newDepositModal'));
    
    // Sample data
    const accounts = [
        {
            id: 'checking',
            name: 'Checking Account',
            number: '••••3456',
            opened: '05/12/2018',
            balance: 12450.00,
            routing: '021000021',
            type: 'checking',
            trend: '+2.5% from last month'
        },
        {
            id: 'savings',
            name: 'Savings Account',
            number: '••••7890',
            opened: '05/12/2018',
            balance: 36070.00,
            interest: '1.25% APY',
            type: 'savings',
            trend: '+3.1% from last month'
        }
    ];
    
    const transactions = [
        {
            date: '2023-06-15',
            description: 'Paycheck Deposit',
            account: 'checking',
            amount: 3250.00,
            status: 'completed'
        },
        {
            date: '2023-06-10',
            description: 'Cash Deposit',
            account: 'savings',
            amount: 1500.00,
            status: 'completed'
        },
        {
            date: '2023-06-05',
            description: 'Check Deposit #10045',
            account: 'checking',
            amount: 750.00,
            status: 'completed'
        },
        {
            date: '2023-06-01',
            description: 'Monthly Savings Transfer',
            account: 'savings',
            amount: 1000.00,
            status: 'completed'
        },
        {
            date: '2023-05-28',
            description: 'Mobile Check Deposit',
            account: 'checking',
            amount: 450.00,
            status: 'pending'
        }
    ];
    
    // Initialize the page
    updateSummary();
    loadTransactions();
    loadAccountDetails();
    
    // Event listeners
    document.getElementById('depositType').addEventListener('change', function() {
        const checkNumberGroup = document.getElementById('checkNumberGroup');
        checkNumberGroup.style.display = this.value === 'check' ? 'block' : 'none';
    });
    
    document.getElementById('depositForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitDeposit();
    });
    
    // Functions
    function updateSummary() {
        const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
        document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
        
        const checkingAccount = accounts.find(acc => acc.type === 'checking');
        const savingsAccount = accounts.find(acc => acc.type === 'savings');
        
        document.getElementById('checkingBalance').textContent = formatCurrency(checkingAccount.balance);
        document.getElementById('savingsBalance').textContent = formatCurrency(savingsAccount.balance);
    }
    
    function loadTransactions() {
        const tbody = document.querySelector('#transactionsTable tbody');
        tbody.innerHTML = '';
        
        transactions.forEach(transaction => {
            const account = accounts.find(acc => acc.id === transaction.account);
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.description}</td>
                <td>${account.name} ${account.number}</td>
                <td>${formatCurrency(transaction.amount)}</td>
                <td><span class="badge ${getStatusClass(transaction.status)}">${capitalizeFirstLetter(transaction.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-print"></i></button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Simple pagination (in a real app, this would be more complex)
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
    
    function loadAccountDetails() {
        const container = document.getElementById('accountDetails');
        container.innerHTML = '';
        
        accounts.forEach(account => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            
            col.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5>${account.name}</h5>
                                <p class="mb-1">${account.number}</p>
                                <p class="text-muted small">Opened: ${account.opened}</p>
                            </div>
                            <div class="text-end">
                                <h4>${formatCurrency(account.balance)}</h4>
                                <p class="text-success small">${account.trend}</p>
                            </div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-6">
                                <p class="small mb-1">${account.type === 'checking' ? 'Routing Number' : 'Interest Rate'}</p>
                                <p class="fw-bold">${account.type === 'checking' ? account.routing : account.interest}</p>
                            </div>
                            <div class="col-6">
                                <p class="small mb-1">Available Balance</p>
                                <p class="fw-bold">${formatCurrency(account.balance)}</p>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-2">View Statements</button>
                    </div>
                </div>
            `;
            
            container.appendChild(col);
        });
    }
    
    function submitDeposit() {
        const account = document.getElementById('depositAccount').value;
        const type = document.getElementById('depositType').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);
        const description = document.getElementById('depositDescription').value || 'New Deposit';
        
        // In a real app, you would send this to a server
        console.log('Submitting deposit:', { account, type, amount, description });
        
        // Add to transactions (in a real app, this would come from the server response)
        const newTransaction = {
            date: new Date().toISOString().split('T')[0],
            description: description,
            account: account,
            amount: amount,
            status: 'completed'
        };
        
        transactions.unshift(newTransaction);
        
        // Update the account balance
        const accountObj = accounts.find(acc => acc.id === account);
        if (accountObj) {
            accountObj.balance += amount;
        }
        
        // Update the UI
        updateSummary();
        loadTransactions();
        loadAccountDetails();
        
        // Show success message
        toast.show();
        
        // Reset form and close modal
        document.getElementById('depositForm').reset();
        depositModal.hide();
    }
    
    // Helper functions
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
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