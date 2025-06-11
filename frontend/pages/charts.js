const typeVolumeChart = new Chart(document.getElementById('typeVolumeChart'), {
  type: 'bar',
  data: {
    labels: ['Utility Bill', 'Mobile Money', 'Airtime', 'Transfer', 'Deposit'],
    datasets: [{
      label: 'Volume',
      data: [200, 180, 150, 100, 170],
      backgroundColor: '#ffcc00'
    }]
  }
});

const monthlyTrendChart = new Chart(document.getElementById('monthlyTrendChart'), {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Monthly Transactions',
      data: [800000, 750000, 780000, 720000, 850000, 790000],
      borderColor: '#ffcc00',
      tension: 0.4
    }]
  }
});

const paymentDepositPie = new Chart(document.getElementById('paymentDepositPie'), {
  type: 'pie',
  data: {
    labels: ['Payments (Outgoing)', 'Deposits (Incoming)'],
    datasets: [{
      data: [58, 42],
      backgroundColor: ['#ff3d3d', '#00cc66']
    }]
  }
});

const averageAmountChart = new Chart(document.getElementById('averageAmountChart'), {
  type: 'bar',
  data: {
    labels: ['Utility Bill', 'Airtime', 'Bank Transfer', 'Deposit'],
    datasets: [{
      label: 'Average Amount',
      data: [15000, 5000, 60000, 55000],
      backgroundColor: '#ffcc00'
    }]
  }
});
