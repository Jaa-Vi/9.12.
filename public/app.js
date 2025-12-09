// DOM Elements
const productsTableBody = document.getElementById('productsTableBody');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const deleteModal = document.getElementById('deleteModal');
const productForm = document.getElementById('productForm');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const searchInput = document.getElementById('searchInput');
const modalTitle = document.getElementById('modalTitle');

// State
let products = [];
let editingProductId = null;
let deletingProductId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addProductBtn.addEventListener('click', () => openModal());
    closeBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click', () => closeModal());
    cancelDeleteBtn.addEventListener('click', () => closeDeleteModal());
    confirmDeleteBtn.addEventListener('click', () => confirmDelete());
    productForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === productModal) closeModal();
        if (e.target === deleteModal) closeDeleteModal();
    });
}

// API Calls
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        products = data.products;
        renderProducts(products);
        updateStats();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    }
}

async function saveProduct(productData) {
    try {
        const url = editingProductId 
            ? `/api/products/${editingProductId}`
            : '/api/products';
        
        const method = editingProductId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Failed to save product');
        }

        await loadProducts();
        closeModal();
        alert(editingProductId ? 'Product updated successfully!' : 'Product added successfully!');
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product');
    }
}

async function deleteProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        await loadProducts();
        closeDeleteModal();
        alert('Product deleted successfully!');
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
    }
}

async function updateQuantity(id, newQuantity) {
    try {
        const product = products.find(p => p.id === id);
        if (!product) return;

        const response = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...product,
                quantity: newQuantity
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update quantity');
        }

        await loadProducts();
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Failed to update quantity');
    }
}

// Render Functions
function renderProducts(productsToRender) {
    productsTableBody.innerHTML = '';

    if (productsToRender.length === 0) {
        productsTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    No products found. Add your first product to get started!
                </td>
            </tr>
        `;
        return;
    }

    productsToRender.forEach(product => {
        const row = document.createElement('tr');
        const totalValue = (product.price * product.quantity).toFixed(2);
        const isLowStock = product.quantity < 20;

        row.innerHTML = `
            <td>${product.id}</td>
            <td><strong>${product.name}</strong></td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>
                <div class="quantity-cell">
                    <span class="${isLowStock ? 'low-stock' : ''}">${product.quantity}</span>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)">-</button>
                        <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)">+</button>
                    </div>
                </div>
            </td>
            <td><strong>$${totalValue}</strong></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-small" onclick="editProduct(${product.id})">✏️ Edit</button>
                    <button class="btn btn-danger btn-small" onclick="openDeleteModal(${product.id})">🗑️ Delete</button>
                </div>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

function updateStats() {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const lowStock = products.filter(p => p.quantity < 20).length;

    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('lowStock').textContent = lowStock;
}

// Modal Functions
function openModal(product = null) {
    productModal.style.display = 'block';
    
    if (product) {
        modalTitle.textContent = 'Edit Product';
        editingProductId = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productDescription').value = product.description || '';
    } else {
        modalTitle.textContent = 'Add New Product';
        editingProductId = null;
        productForm.reset();
    }
}

function closeModal() {
    productModal.style.display = 'none';
    editingProductId = null;
    productForm.reset();
}

function openDeleteModal(id) {
    deletingProductId = id;
    deleteModal.style.display = 'block';
}

function closeDeleteModal() {
    deleteModal.style.display = 'none';
    deletingProductId = null;
}

function confirmDelete() {
    if (deletingProductId) {
        deleteProduct(deletingProductId);
    }
}

// Form Handler
function handleFormSubmit(e) {
    e.preventDefault();

    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value),
        description: document.getElementById('productDescription').value
    };

    saveProduct(productData);
}

// Search Handler
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );
    renderProducts(filtered);
}

// Global Functions (called from HTML)
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        openModal(product);
    }
}

function changeQuantity(id, delta) {
    const product = products.find(p => p.id === id);
    if (product) {
        const newQuantity = Math.max(0, product.quantity + delta);
        updateQuantity(id, newQuantity);
    }
}
