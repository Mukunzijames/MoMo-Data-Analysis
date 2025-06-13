document.addEventListener('DOMContentLoaded', function() {
    // Sample data for charts
    const monthlyBalanceData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Account Balance',
            data: [32000, 35000, 38000, 42000, 45000, 48500],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    };

    const incomeExpenseData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Income',
                data: [5200, 5500, 5800, 6000, 6200, 6250],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2
            },
            {
                label: 'Expenses',
                data: [3800, 4000, 4200, 4500, 4300, 3450],
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderWidth: 2
            }
        ]
    };

    const categoryData = {
        labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Others'],
        datasets: [{
            data: [1200, 800, 600, 300, 350, 200],
            backgroundColor: [
                '#3498db',
                '#2ecc71',
                '#f39c12',
                '#e74c3c',
                '#9b59b6',
                '#34495e'
            ],
            borderWidth: 1
        }]
    };

    const recentTransactions = [
        { date: '2023-06-15', description: 'Grocery Store', amount: 125.50, category: 'Food' },
        { date: '2023-06-14', description: 'Electric Bill', amount: 85.00, category: 'Utilities' },
        { date: '2023-06-12', description: 'Gas Station', amount: 45.30, category: 'Transport' },
        { date: '2023-06-10', description: 'Salary Deposit', amount: 3250.00, category: 'Income' },
        { date: '2023-06-08', description: 'Rent Payment', amount: 1200.00, category: 'Housing' }
    ];

    // Initialize Charts
    const balanceChart = new Chart(
        document.getElementById('balanceChart'),
        {
            type: 'line',
            data: monthlyBalanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        }
    );

    const incomeExpenseChart = new Chart(
        document.getElementById('incomeExpenseChart'),
        {
            type: 'bar',
            data: incomeExpenseData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );

    const categoryChart = new Chart(
        document.getElementById('categoryChart'),
        {
            type: 'doughnut',
            data: categoryData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        }
    );

    // Populate Recent Transactions Table
    const transactionsTable = document.querySelector('#recentTransactions tbody');
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.description}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td><span class="badge" style="background-color: ${getCategoryColor(transaction.category)}">${transaction.category}</span></td>
        `;
        transactionsTable.appendChild(row);
    });

    // Helper Functions
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    function getCategoryColor(category) {
        const colors = {
            'Housing': '#3498db',
            'Food': '#2ecc71',
            'Transport': '#f39c12',
            'Entertainment': '#e74c3c',
            'Utilities': '#9b59b6',
            'Income': '#27ae60',
            'Others': '#34495e'
        };
        return colors[category] || '#7f8c8d';
    }
});