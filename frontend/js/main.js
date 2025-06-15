// Main JavaScript file for handling AJAX page loading
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Handle navigation clicks
    setupNavigation();
});

// Initialize the application
function initApp() {
    // Load the dashboard by default
    loadPage('dashboard');
    
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
}

// Setup navigation event listeners
function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the page identifier from href attribute
            const pageId = this.getAttribute('href').substring(1);
            
            // Remove active class from all links
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Close sidebar on mobile after click
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 576) {
                sidebar.classList.remove('expanded');
            }
            
            // Load the page content
            loadPage(pageId);
        });
    });
}

// Load page content via AJAX
function loadPage(pageId) {
    // Show loading indicator
    const mainContent = document.querySelector('.dashboard-content');
    mainContent.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    
    // Fetch the page content
    fetch(`frontend/html/${pageId}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Page not found');
            }
            return response.text();
        })
        .then(html => {
            // Update the content
            mainContent.innerHTML = html;
            
            // Initialize page-specific scripts
            initPageScripts(pageId);
        })
        .catch(error => {
            mainContent.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Page</h2>
                    <p>${error.message}</p>
                </div>
            `;
        });
}

// Initialize page-specific scripts
function initPageScripts(pageId) {
    // Clear any previous page-specific event listeners
    
    switch(pageId) {
        case 'dashboard':
            // Initialize dashboard components
            if (typeof initializeDashboard === 'function') {
                initializeDashboard();
            }
            break;
        case 'incoming-money':
            // Initialize incoming money page
            if (typeof initializeIncomingMoney === 'function') {
                initializeIncomingMoney();
            }
            break;
        case 'payments-code':
            // Initialize payments to code holders page
            if (typeof initializePaymentsCode === 'function') {
                initializePaymentsCode();
            }
            break;
        case 'transfers-mobile':
            // Initialize transfers to mobile numbers page
            if (typeof initializeTransfersMobile === 'function') {
                initializeTransfersMobile();
            }
            break;
        case 'bank-deposits':
            // Initialize bank deposits page
            if (typeof initializeBankDeposits === 'function') {
                initializeBankDeposits();
            }
            break;
        case 'airtime-payments':
            // Initialize airtime bill payments page
            if (typeof initializeAirtimePayments === 'function') {
                initializeAirtimePayments();
            }
            break;
        case 'power-payments':
            // Initialize cash power bill payments page
            if (typeof initializePowerPayments === 'function') {
                initializePowerPayments();
            }
            break;
        case 'third-party':
            // Initialize third party transactions page
            if (typeof initializeThirdParty === 'function') {
                initializeThirdParty();
            }
            break;
        case 'withdrawals':
            // Initialize withdrawals from agents page
            if (typeof initializeWithdrawals === 'function') {
                initializeWithdrawals();
            }
            break;
        case 'bank-transfers':
            // Initialize bank transfers page
            if (typeof initializeBankTransfers === 'function') {
                initializeBankTransfers();
            }
            break;
        case 'internet-bundles':
            // Initialize internet & voice bundles page
            if (typeof initializeInternetBundles === 'function') {
                initializeInternetBundles();
            }
            break;
    }
}

// API Utility Functions
const API = {
    baseURL: '/api',
    
    // Generic GET request with optional query parameters
    async get(endpoint, params = {}) {
        try {
            const url = new URL(`${window.location.origin}${this.baseURL}${endpoint}`);
            
            // Add query parameters
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Generic POST request
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Endpoint-specific methods
    async getIncomingMoney(params) {
        return this.get('/incoming-money', params);
    },
    
    async getIncomingMoneyStatistics(params) {
        return this.get('/incoming-money/statistics', params);
    },
    
    async getTopSenders(params) {
        return this.get('/incoming-money/top-senders', params);
    },
    
    async getCashPowerTransactions(params) {
        return this.get('/cash-power', params);
    },
    
    async getCashPowerStatistics(params) {
        return this.get('/cash-power/statistics', params);
    },
    
    async getCashPowerMonthlyTrends(params) {
        return this.get('/cash-power/trends/monthly', params);
    },
    
    async getThirdPartyTransactions(params) {
        return this.get('/third-party', params);
    },
    
    async getThirdPartyStatistics(params) {
        return this.get('/third-party/statistics', params);
    },
    
    async getTopVendors(params) {
        return this.get('/third-party/top-vendors', params);
    },
    
    async getWithdrawalTransactions(params) {
        return this.get('/withdrawals', params);
    },
    
    async getWithdrawalStatistics(params) {
        return this.get('/withdrawals/statistics', params);
    },
    
    async getTopAgents(params) {
        return this.get('/withdrawals/top-agents', params);
    },
    
    async getMobileTransferTransactions(params) {
        return this.get('/mobile-transfers', params);
    },
    
    async getMobileTransferStatistics(params) {
        return this.get('/mobile-transfers/statistics', params);
    },
    
    async getTopRecipients(params) {
        return this.get('/mobile-transfers/top-recipients', params);
    },
    
    async getBankTransferTransactions(params) {
        return this.get('/bank-transfers', params);
    },
    
    async getBankTransferStatistics(params) {
        return this.get('/bank-transfers/statistics', params);
    },
    
    async getTopBanks(params) {
        return this.get('/bank-transfers/top-banks', params);
    },
    
    async getSavedBankAccounts(params) {
        return this.get('/bank-transfers/saved-accounts', params);
    },
    
    async getBundleTransactions(params) {
        return this.get('/bundles', params);
    },
    
    async getBundleStatistics(params) {
        return this.get('/bundles/statistics', params);
    },
    
    async getBundleBreakdown(params) {
        return this.get('/bundles/breakdown', params);
    },
    
    async getFrequentNumbers(params) {
        return this.get('/bundles/frequent-numbers', params);
    }
};

// Common UI Functions for Transactions
const UI = {
    renderPagination(metadata, targetId, onPageChange) {
        const paginationElement = document.getElementById(targetId);
        if (!paginationElement) return;
        
        const { totalPages, currentPage } = metadata;
        
        let paginationHTML = '<ul class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `<li><button class="page-link" data-page="${currentPage - 1}">Previous</button></li>`;
        } else {
            paginationHTML += `<li><button class="page-link disabled">Previous</button></li>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHTML += `<li><button class="page-link active" data-page="${i}">${i}</button></li>`;
            } else {
                paginationHTML += `<li><button class="page-link" data-page="${i}">${i}</button></li>`;
            }
        }
        
        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `<li><button class="page-link" data-page="${currentPage + 1}">Next</button></li>`;
        } else {
            paginationHTML += `<li><button class="page-link disabled">Next</button></li>`;
        }
        
        paginationHTML += '</ul>';
        
        paginationElement.innerHTML = paginationHTML;
        
        // Add event listeners
        const pageLinks = paginationElement.querySelectorAll('.page-link:not(.disabled)');
        pageLinks.forEach(link => {
            link.addEventListener('click', function() {
                const page = this.getAttribute('data-page');
                if (typeof onPageChange === 'function') {
                    onPageChange(parseInt(page));
                }
            });
        });
    },
    
    formatMoney(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },
    
    showLoading(targetElement) {
        targetElement.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
    },
    
    showError(targetElement, message) {
        targetElement.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}; 