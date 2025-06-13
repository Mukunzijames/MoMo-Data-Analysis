document.addEventListener('DOMContentLoaded', function() {
    const transferForm = document.getElementById('transferForm');
    const confirmation = document.getElementById('confirmation');
    const transferDetails = document.getElementById('transferDetails');
    const newTransferBtn = document.getElementById('newTransferBtn');
    
    transferForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const recipientName = document.getElementById('recipientName').value;
        const mobileNumber = document.getElementById('mobileNumber').value;
        const country = document.getElementById('country').value;
        const networkProvider = document.getElementById('networkProvider').value;
        const amount = document.getElementById('amount').value;
        const recipientId = document.getElementById('recipientId').value;
        
        // Validate amount
        if (parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Show confirmation with details
        transferDetails.innerHTML = `
            <p><strong>Recipient Name:</strong> ${recipientName}</p>
            <p><strong>Mobile Number:</strong> ${mobileNumber}</p>
            <p><strong>Country:</strong> ${getCountryName(country)}</p>
            <p><strong>Network Provider:</strong> ${networkProvider}</p>
            <p><strong>Amount:</strong> $${parseFloat(amount).toFixed(2)}</p>
            ${recipientId ? `<p><strong>Recipient ID:</strong> ${recipientId}</p>` : ''}
            <p><strong>Transaction ID:</strong> ${generateTransactionId()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `;
        
        // Hide form and show confirmation
        transferForm.classList.add('hidden');
        confirmation.classList.remove('hidden');
    });
    
    newTransferBtn.addEventListener('click', function() {
        // Reset form and show it again
        transferForm.reset();
        transferForm.classList.remove('hidden');
        confirmation.classList.add('hidden');
    });
    
    function getCountryName(countryCode) {
        const countries = {
            'US': 'United States',
            'UK': 'United Kingdom',
            'KE': 'Kenya',
            'NG': 'Nigeria',
            'GH': 'Ghana',
            'ZA': 'South Africa'
        };
        return countries[countryCode] || countryCode;
    }
    
    function generateTransactionId() {
        return 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
});