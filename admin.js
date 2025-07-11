// Global variables
let currentUser = null;
let currentEditingProduct = null;

// API base URL
const API_BASE = '/api';

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
  checkAuthStatus();
  setupEventListeners();
});

// Check if user is already logged in
function checkAuthStatus() {
  const token = localStorage.getItem('adminToken');
  if (token) {
    // Verify token with server
    fetch(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Invalid token');
    })
    .then(user => {
      if (user.role === 'admin') {
        currentUser = user;
        showAdminPanel();
        loadDashboardData();
      } else {
        showLoginModal();
      }
    })
    .catch(() => {
      localStorage.removeItem('adminToken');
      showLoginModal();
    });
  } else {
    showLoginModal();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', handleNavigation);
  });
  
  // Add product button
  document.getElementById('addProductBtn').addEventListener('click', () => {
    currentEditingProduct = null;
    openProductModal();
  });
  
  // Product form
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
}

// Show/hide modals and panels
function showLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'flex';
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.user.role === 'admin') {
      localStorage.setItem('adminToken', data.token);
      currentUser = data.user;
      showAdminPanel();
      loadDashboardData();
    } else {
      alert('Invalid admin credentials');
    }
  } catch (error) {
    alert('Login failed. Please try again.');
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('adminToken');
  currentUser = null;
  showLoginModal();
}

// Handle navigation
function handleNavigation(e) {
  e.preventDefault();
  
  const section = e.currentTarget.dataset.section;
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  e.currentTarget.classList.add('active');
  
  // Show corresponding section
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(section).classList.add('active');
  
  // Load section data
  switch(section) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'products':
      loadProducts();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'customers':
      loadCustomers();
      break;
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    const stats = await response.json();
    
    document.getElementById('totalProducts').textContent = stats.totalProducts;
    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue.toFixed(0)}`;
    document.getElementById('totalCustomers').textContent = stats.totalCustomers;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();
    
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = '';
    
    products.forEach(product => {
      const row = document.createElement('tr');
      const salePrice = (product.price * (1 - product.discount / 100)).toFixed(0);
      
      row.innerHTML = `
        <td><img src="${product.image}" alt="${product.name}" class="product-image"></td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>₹${salePrice} ${product.discount > 0 ? `<small style="text-decoration: line-through; color: #64748b;">₹${product.price}</small>` : ''}</td>
        <td>${product.stock}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">Edit</button>
            <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
          </div>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

// Load orders
async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE}/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    const orders = await response.json();
    
    const tbody = document.getElementById('ordersTable');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
      const row = document.createElement('tr');
      const date = new Date(order.created_at).toLocaleDateString();
      const itemCount = order.items.length;
      
      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${order.customer_name || 'Guest'}<br><small>${order.customer_email || ''}</small></td>
        <td>${itemCount} item${itemCount > 1 ? 's' : ''}</td>
        <td>₹${order.total_amount.toFixed(0)}</td>
        <td><span class="status-badge status-${order.status}">${order.status}</span></td>
        <td>${date}</td>
        <td>
          <select class="btn-sm btn-status" onchange="updateOrderStatus(${order.id}, this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

// Load customers
async function loadCustomers() {
  try {
    const response = await fetch(`${API_BASE}/admin/customers`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    const customers = await response.json();
    
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
      const row = document.createElement('tr');
      const date = new Date(customer.created_at).toLocaleDateString();
      
      row.innerHTML = `
        <td>${customer.name}</td>
        <td>${customer.email}</td>
        <td>${customer.phone || 'N/A'}</td>
        <td>${date}</td>
      `;
      
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load customers:', error);
  }
}

// Product modal functions
function openProductModal(product = null) {
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');
  
  if (product) {
    title.textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDiscount').value = product.discount;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productId').disabled = true;
  } else {
    title.textContent = 'Add Product';
    form.reset();
    document.getElementById('productId').disabled = false;
  }
  
  modal.style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  currentEditingProduct = null;
}

// Handle product form submission
async function handleProductSubmit(e) {
  e.preventDefault();
  
  const formData = {
    id: document.getElementById('productId').value,
    name: document.getElementById('productName').value,
    price: parseFloat(document.getElementById('productPrice').value),
    discount: parseFloat(document.getElementById('productDiscount').value) || 0,
    category: document.getElementById('productCategory').value,
    stock: parseInt(document.getElementById('productStock').value),
    image: document.getElementById('productImage').value,
    description: document.getElementById('productDescription').value
  };
  
  try {
    const url = currentEditingProduct 
      ? `${API_BASE}/admin/products/${currentEditingProduct.id}`
      : `${API_BASE}/admin/products`;
    
    const method = currentEditingProduct ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      closeProductModal();
      loadProducts();
      alert(currentEditingProduct ? 'Product updated successfully!' : 'Product added successfully!');
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to save product');
    }
  } catch (error) {
    alert('Failed to save product. Please try again.');
  }
}

// Edit product
async function editProduct(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    const product = await response.json();
    
    currentEditingProduct = product;
    openProductModal(product);
  } catch (error) {
    alert('Failed to load product details');
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    
    if (response.ok) {
      loadProducts();
      alert('Product deleted successfully!');
    } else {
      alert('Failed to delete product');
    }
  } catch (error) {
    alert('Failed to delete product. Please try again.');
  }
}

// Update order status
async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      alert('Order status updated successfully!');
    } else {
      alert('Failed to update order status');
      loadOrders(); // Reload to reset the select
    }
  } catch (error) {
    alert('Failed to update order status. Please try again.');
    loadOrders(); // Reload to reset the select
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  const loginModal = document.getElementById('loginModal');
  const productModal = document.getElementById('productModal');
  
  if (event.target === loginModal) {
    // Don't close login modal by clicking outside
  }
  
  if (event.target === productModal) {
    closeProductModal();
  }
}