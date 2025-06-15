// Payments to Code Holders page specific functions
function initializePaymentsCode() {
    console.log('Initializing Payments to Code Holders page...');
    loadPaymentsData();
}

async function loadPaymentsData() {
    try {
        const response = await fetch('http://localhost:3000/api/code-holder-payments');
        const jsonData = await response.json();
        const data = jsonData.data;

        const tableBody = document.getElementById('paymentsCodeTableBody');
        tableBody.innerHTML = ''; // Clear previous rows

        data.forEach(item => {
            const row = document.createElement('tr');

            // Define status based on totalSent and totalReceived
            const status = parseFloat(item.totalReceived) > parseFloat(item.totalSent)
                ? 'Profit'
                : parseFloat(item.totalReceived) < parseFloat(item.totalSent)
                ? 'Loss'
                : 'Neutral';
                
            // Define status class for styling
            const statusClass = status === 'Profit' 
                ? 'status-profit' 
                : status === 'Loss' 
                ? 'status-loss' 
                : 'status-neutral';

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.phoneNumber || 'N/A'}</td>
                <td>RWF ${formatNumber(parseFloat(item.totalSent))}</td>
                <td>RWF ${formatNumber(parseFloat(item.totalReceived))}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
            `;

            tableBody.appendChild(row);
        });
        
        // Add CSS for status indicators if not already added
        addStatusStyles();

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add CSS styles for status indicators
function addStatusStyles() {
    // Check if styles are already added
    if (document.getElementById('payment-status-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'payment-status-styles';
    styleElement.textContent = `
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
            text-align: center;
        }
        .status-profit {
            background-color: #d4edda;
            color: #155724;
        }
        .status-loss {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status-neutral {
            background-color: #e2e3e5;
            color: #383d41;
        }
        .view-btn {
            background-color: #006b86;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
        }
        .view-btn:hover {
            background-color: #005269;
        }
    `;
    document.head.appendChild(styleElement);
}

// View contact details
function viewContactDetails(contactId) {
    if (!contactId) return;
    
    // Fetch contact details and show in a modal
    const apiUrl = `http://localhost:3000/api/code-holder-payments/${contactId}`;
    console.log('Fetching contact details from:', apiUrl);
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(contact => {
            showContactDetailsModal(contact);
        })
        .catch(error => {
            console.error('Error fetching contact details:', error);
            alert('Failed to load contact details.');
        });
}

// Show contact details modal
function showContactDetailsModal(contact) {
    // Create modal HTML
    const modalHtml = `
        <div class="modal-backdrop"></div>
        <div class="modal">
            <div class="modal-header">
                <h2>Contact Details</h2>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="contact-details">
                    <p><strong>ID:</strong> ${contact.id}</p>
                    <p><strong>Name:</strong> ${contact.name || 'N/A'}</p>
                    <p><strong>Phone Number:</strong> ${contact.phoneNumber || 'N/A'}</p>
                    <p><strong>Total Transactions:</strong> ${contact.transactionCount || 0}</p>
                    <p><strong>Total Sent:</strong> RWF ${contact.totalSent || 0}</p>
                    <p><strong>Total Received:</strong> RWF ${contact.totalReceived || 0}</p>
                    <p><strong>Last Transaction Date:</strong> ${formatDate(contact.lastTransactionDate) || 'N/A'}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'contactModal';
    modalContainer.classList.add('modal-container');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
} 