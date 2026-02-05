// Initialize data storage
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
let invoices = JSON.parse(localStorage.getItem('invoices')) || [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
      loadCustomers();
      loadJobs();
      loadInvoices();
      updateDashboard();
      setupNavigation();
});

// Navigation setup
function setupNavigation() {
      const navLinks = document.querySelectorAll('.nav-links a');
      navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                              e.preventDefault();
                              const target = this.getAttribute('href').substring(1);
                              if (target === '') return;

                                                  // Hide all sections
                                                  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                              // Show selected section
                                                  document.getElementById(target).classList.add('active');

                                                  // Update active nav link
                                                  navLinks.forEach(l => l.classList.remove('active'));
                              this.classList.add('active');
                });
      });

    // Logout functionality
    document.getElementById('logout').addEventListener('click', function(e) {
              e.preventDefault();
              alert('Logged out successfully!');
    });
}

// Dashboard functions
function updateDashboard() {
      document.getElementById('totalCustomers').textContent = customers.length;
      document.getElementById('activeJobs').textContent = jobs.filter(j => j.status !== 'Completed').length;
      document.getElementById('pendingInvoices').textContent = invoices.filter(i => i.status !== 'Paid').length;

    const totalRevenue = jobs.reduce((sum, job) => sum + (parseFloat(job.cost) || 0), 0);
      document.getElementById('monthlyRevenue').textContent = '$' + totalRevenue.toFixed(2);

    updateReports();
}

// Customer functions
function addCustomer() {
      const name = document.getElementById('customerName').value.trim();
      const email = document.getElementById('customerEmail').value.trim();
      const phone = document.getElementById('customerPhone').value.trim();

    if (!name || !email || !phone) {
              alert('Please fill in all customer fields');
              return;
    }

    const customer = {
              id: Date.now(),
              name: name,
              email: email,
              phone: phone,
              date: new Date().toLocaleDateString()
    };

    customers.push(customer);
      localStorage.setItem('customers', JSON.stringify(customers));

    document.getElementById('customerName').value = '';
      document.getElementById('customerEmail').value = '';
      document.getElementById('customerPhone').value = '';

    loadCustomers();
      updateJobCustomerSelect();
      updateDashboard();
}

function loadCustomers() {
      const tbody = document.getElementById('customersBody');
      tbody.innerHTML = '';

    customers.forEach(customer => {
              const row = `
                          <tr>
                                          <td>${customer.name}</td>
                                                          <td>${customer.email}</td>
                                                                          <td>${customer.phone}</td>
                                                                                          <td>
                                                                                                              <button class="btn-danger" onclick="deleteCustomer(${customer.id})">Delete</button>
                                                                                                                              </td>
                                                                                                                                          </tr>
                                                                                                                                                  `;
              tbody.innerHTML += row;
    });
}

function deleteCustomer(id) {
      if (confirm('Are you sure you want to delete this customer?')) {
                customers = customers.filter(c => c.id !== id);
                localStorage.setItem('customers', JSON.stringify(customers));
                loadCustomers();
                updateJobCustomerSelect();
                updateDashboard();
      }
}

function updateJobCustomerSelect() {
      const select = document.getElementById('jobCustomer');
      select.innerHTML = '<option value="">Select Customer</option>';
      customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                select.appendChild(option);
      });
}

// Job functions
function addJob() {
      const customerId = document.getElementById('jobCustomer').value;
      const jobType = document.getElementById('jobType').value.trim();
      const jobDate = document.getElementById('jobDate').value;
      const jobCost = document.getElementById('jobCost').value;
      const jobStatus = document.getElementById('jobStatus').value;

    if (!customerId || !jobType || !jobDate || !jobCost) {
              alert('Please fill in all job fields');
              return;
    }

    const customer = customers.find(c => c.id == customerId);

    const job = {
              id: Date.now(),
              customerId: parseInt(customerId),
              customerName: customer.name,
              type: jobType,
              date: jobDate,
              cost: parseFloat(jobCost),
              status: jobStatus,
              createdDate: new Date().toLocaleDateString()
    };

    jobs.push(job);
      localStorage.setItem('jobs', JSON.stringify(jobs));

    document.getElementById('jobCustomer').value = '';
      document.getElementById('jobType').value = '';
      document.getElementById('jobDate').value = '';
      document.getElementById('jobCost').value = '';
      document.getElementById('jobStatus').value = 'Pending';

    loadJobs();
      updateInvoiceJobSelect();
      updateDashboard();
}

function loadJobs() {
      const tbody = document.getElementById('jobsBody');
      tbody.innerHTML = '';

    jobs.forEach(job => {
              const statusColor = job.status === 'Completed' ? 'green' : job.status === 'In Progress' ? 'orange' : 'gray';
              const row = `
                          <tr>
                                          <td>${job.customerName}</td>
                                                          <td>${job.type}</td>
                                                                          <td>${job.date}</td>
                                                                                          <td>$${job.cost.toFixed(2)}</td>
                                                                                                          <td><span style="background: ${statusColor}; color: white; padding: 5px 10px; border-radius: 3px;">${job.status}</span></td>
                                                                                                                          <td>
                                                                                                                                              <button class="btn-danger" onclick="deleteJob(${job.id})">Delete</button>
                                                                                                                                                              </td>
                                                                                                                                                                          </tr>
                                                                                                                                                                                  `;
              tbody.innerHTML += row;
    });
}

function deleteJob(id) {
      if (confirm('Are you sure you want to delete this job?')) {
                jobs = jobs.filter(j => j.id !== id);
                localStorage.setItem('jobs', JSON.stringify(jobs));
                loadJobs();
                updateInvoiceJobSelect();
                updateDashboard();
      }
}

function updateInvoiceJobSelect() {
      const select = document.getElementById('invoiceJob');
      select.innerHTML = '<option value="">Select Job</option>';
      jobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.customerName + ' - ' + job.type;
                select.appendChild(option);
      });
}

// Invoice functions
function createInvoice() {
      const jobId = document.getElementById('invoiceJob').value;
      const amount = document.getElementById('invoiceAmount').value;
      const status = document.getElementById('invoiceStatus').value;

    if (!jobId || !amount) {
              alert('Please fill in all invoice fields');
              return;
    }

    const invoice = {
              id: Date.now(),
              jobId: parseInt(jobId),
              amount: parseFloat(amount),
              status: status,
              date: new Date().toLocaleDateString()
    };

    invoices.push(invoice);
      localStorage.setItem('invoices', JSON.stringify(invoices));

    document.getElementById('invoiceJob').value = '';
      document.getElementById('invoiceAmount').value = '';
      document.getElementById('invoiceStatus').value = 'Draft';

    loadInvoices();
      updateDashboard();
}

function loadInvoices() {
      const tbody = document.getElementById('invoicesBody');
      tbody.innerHTML = '';

    invoices.forEach(invoice => {
              const job = jobs.find(j => j.id == invoice.jobId);
              const statusColor = invoice.status === 'Paid' ? 'green' : invoice.status === 'Sent' ? 'blue' : 'gray';
              const row = `
                          <tr>
                                          <td>${job ? job.id : 'N/A'}</td>
                                                          <td>$${invoice.amount.toFixed(2)}</td>
                                                                          <td><span style="background: ${statusColor}; color: white; padding: 5px 10px; border-radius: 3px;">${invoice.status}</span></td>
                                                                                          <td>${invoice.date}</td>
                                                                                                          <td>
                                                                                                                              <button class="btn-danger" onclick="deleteInvoice(${invoice.id})">Delete</button>
                                                                                                                                              </td>
                                                                                                                                                          </tr>
                                                                                                                                                                  `;
              tbody.innerHTML += row;
    });
}

function deleteInvoice(id) {
      if (confirm('Are you sure you want to delete this invoice?')) {
                invoices = invoices.filter(i => i.id !== id);
                localStorage.setItem('invoices', JSON.stringify(invoices));
                loadInvoices();
                updateDashboard();
      }
}

// Reports functions
function updateReports() {
      updateJobStatusDistribution();
      updateCustomerSummary();
      updateRevenueChart();
}

function updateJobStatusDistribution() {
      const list = document.getElementById('jobStatusList');
      list.innerHTML = '';

    const statuses = ['Pending', 'In Progress', 'Completed'];
      statuses.forEach(status => {
                const count = jobs.filter(j => j.status === status).length;
                const item = `<li>${status}: <strong>${count}</strong> jobs</li>`;
                list.innerHTML += item;
      });
}

function updateCustomerSummary() {
      const list = document.getElementById('customerSummary');
      list.innerHTML = '';

    customers.forEach(customer => {
              const customerJobs = jobs.filter(j => j.customerId === customer.id).length;
              const item = `<li>${customer.name}: <strong>${customerJobs}</strong> jobs</li>`;
              list.innerHTML += item;
    });
}

function updateRevenueChart() {
      const total = jobs.reduce((sum, j) => sum + j.cost, 0);
      document.getElementById('revenueText').textContent = 'Total Revenue: $' + total.toFixed(2);
}

function exportReport() {
      let csv = 'Job Reports\n\n';
      csv += 'Customer,Job Type,Date,Cost,Status\n';
      jobs.forEach(job => {
                csv += `${job.customerName},${job.type},${job.date},${job.cost},${job.status}\n`;
      });

    const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', 'trade-master-report.csv');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
}
