// 商品管理系统 - 原生JavaScript实现

// 全局变量
let products = [];
let orders = [];
let categories = [];
let currentProductId = null;
let isEditing = false;
let isLoadingAnalyticsData = false;
// 使用环境变量或默认值，支持Vercel部署
const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL)
    ? process.env.API_BASE_URL
    : (window.ENV && window.ENV.API_BASE_URL)
        ? window.ENV.API_BASE_URL
        : 'https://xianguo-217100-7-1320842230.sh.run.tcloudbase.com/api';

// DOM元素
let modalOverlay;
let modalTitle;
let productForm;
let productIdInput;
let productNameInput;
let productDescriptionInput;
let productPriceInput;
let productOriginalPriceInput;
let productCategoryInput;
let productStockInput;
let productImgInput;
let productImgFileInput;
let submitBtn;
let addProductBtn;
let closeModalBtn;
let cancelBtn;
let searchInput;
let productListBody;
let productsEmptyState;
let exportDataBtn;
let importDataBtn;
let fileInput;
let errorMessage;
let errorText;
let closeErrorBtn;
// 订单相关DOM元素
let tabBtns;
let productsActions;
let ordersActions;
let analyticsActions;
let productsPage;
let ordersPage;
let analyticsPage;
let orderSearchInput;
let orderStatusFilter;
let orderListBody;
let ordersEmptyState;
// 数据分析相关DOM元素
let analyticsOverview;
let totalProducts;
let totalOrders;
let totalSales;
let avgOrderAmount;
let orderFlowChart;
let productSalesChart;
let salesDataBody;
let orderFlowChartInstance;
let productSalesChartInstance;
// 分页相关变量
let salesData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let totalPages = 1;
let paginationInfo;
let prevPageBtn;
let nextPageBtn;

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    getDOMElements();
    bindEvents();
    loadProducts();
    loadCategories();
});

// 获取DOM元素
function getDOMElements () {
    // 商品相关元素
    modalOverlay = document.getElementById('modal-overlay');
    modalTitle = document.getElementById('modal-title');
    productForm = document.getElementById('product-form');
    productIdInput = document.getElementById('product-id');
    productNameInput = document.getElementById('product-name');
    productDescriptionInput = document.getElementById('product-description');
    productPriceInput = document.getElementById('product-price');
    productOriginalPriceInput = document.getElementById('product-original-price');
    productCategoryInput = document.getElementById('product-category');
    productStockInput = document.getElementById('product-stock');
    productImgInput = document.getElementById('product-img');
    productImgFileInput = document.getElementById('product-img-file');
    submitBtn = document.getElementById('submit-btn');
    addProductBtn = document.getElementById('add-product-btn');
    closeModalBtn = document.getElementById('close-modal-btn');
    cancelBtn = document.getElementById('cancel-btn');
    searchInput = document.getElementById('search-input');
    productListBody = document.getElementById('product-list-body');
    productsEmptyState = document.getElementById('products-empty-state');
    exportDataBtn = document.getElementById('export-data-btn');
    importDataBtn = document.getElementById('import-data-btn');
    fileInput = document.getElementById('file-input');
    errorMessage = document.getElementById('error-message');
    errorText = document.getElementById('error-text');
    closeErrorBtn = document.getElementById('close-error-btn');

    // 订单相关元素
    tabBtns = document.querySelectorAll('.tab-btn');
    productsActions = document.getElementById('products-actions');
    ordersActions = document.getElementById('orders-actions');
    productsPage = document.getElementById('products-page');
    ordersPage = document.getElementById('orders-page');
    analyticsPage = document.getElementById('analytics-page');
    orderSearchInput = document.getElementById('order-search-input');
    orderStatusFilter = document.getElementById('order-status-filter');
    orderListBody = document.getElementById('order-list-body');
    ordersEmptyState = document.getElementById('orders-empty-state');

    // 数据分析相关元素
    totalProducts = document.getElementById('total-products');
    totalOrders = document.getElementById('total-orders');
    totalSales = document.getElementById('total-sales');
    avgOrderAmount = document.getElementById('avg-order-amount');
    orderFlowChart = document.getElementById('order-flow-chart');
    productSalesChart = document.getElementById('product-sales-chart');
    salesDataBody = document.getElementById('sales-data-body');
    // 分页相关元素
    paginationInfo = document.getElementById('pagination-info');
    prevPageBtn = document.getElementById('prev-page-btn');
    nextPageBtn = document.getElementById('next-page-btn');

    console.log('DOM elements obtained:', {
        productForm: !!productForm,
        addProductBtn: !!addProductBtn,
        submitBtn: !!submitBtn,
        tabBtns: tabBtns.length,
        ordersPage: !!ordersPage,
        analyticsPage: !!analyticsPage
    });
}

// 绑定事件
function bindEvents () {
    console.log('Binding events...');
    // 模态框事件
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddModal);
        console.log('Add product button event bound');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // 表单事件
    if (productForm) {
        productForm.addEventListener('submit', handleFormSubmit);
        console.log('Product form submit event bound');
    }

    // 搜索事件
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // 数据导入导出事件
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }

    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', importData);
    }

    // 错误信息事件
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideError);
    }

    // 图片上传事件
    if (productImgFileInput) {
        productImgFileInput.addEventListener('change', handleImageUpload);
    }

    // 标签页事件
    if (tabBtns) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', handleTabChange);
        });
    }

    // 订单搜索和筛选事件
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', handleOrderSearch);
    }

    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', handleOrderFilter);
    }

    // 分页按钮事件
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', handlePrevPage);
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', handleNextPage);
    }

    console.log('Events bound successfully');
}

// 标签页切换
function handleTabChange (e) {
    const tabName = e.target.dataset.tab;

    // 更新标签页按钮状态
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // 切换页面内容
    if (tabName === 'products') {
        productsActions.style.display = 'block';
        ordersActions.style.display = 'none';
        productsPage.style.display = 'block';
        ordersPage.style.display = 'none';
        analyticsPage.style.display = 'none';
        // 重新加载商品数据
        loadProducts();
    } else if (tabName === 'orders') {
        productsActions.style.display = 'none';
        ordersActions.style.display = 'block';
        productsPage.style.display = 'none';
        ordersPage.style.display = 'block';
        analyticsPage.style.display = 'none';
        // 加载订单数据
        loadOrders();
    } else if (tabName === 'analytics') {
        productsActions.style.display = 'none';
        ordersActions.style.display = 'none';
        productsPage.style.display = 'none';
        ordersPage.style.display = 'none';
        analyticsPage.style.display = 'block';
        // 使用setTimeout确保DOM已更新并准备好
        setTimeout(() => {
            loadAnalyticsData();
        }, 0);
    }
}

// 加载商品数据
async function loadProducts () {
    console.log('Loading products from API...');
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        products = await response.json();
        // 按照创建时间倒序排序，新添加的商品显示在最顶部
        products.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt).getTime();
            const dateB = new Date(b.created_at || b.createdAt).getTime();
            return dateB - dateA;
        });
        renderProductList();
    } catch (error) {
        console.error('Error loading products:', error);
        showError('加载商品失败: ' + error.message);
        // 使用模拟数据作为fallback
        loadMockProducts();
    }
}

// 加载订单数据
async function loadOrders () {
    console.log('Loading orders from API...');
    try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        orders = await response.json();
        renderOrderList();
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('加载订单失败: ' + error.message);
        orderListBody.innerHTML = '';
        ordersEmptyState.style.display = 'block';
    }
}

// 加载分类数据
async function loadCategories () {
    console.log('Loading categories from API...');
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) {
            throw new Error('Failed to load categories');
        }
        categories = await response.json();
        renderCategoryOptions();
    } catch (error) {
        console.error('Error loading categories:', error);
        const defaultCategories = [
            { id: '0', name: '新鲜水果' },
            { id: '1', name: '时令果蔬' },
            { id: '2', name: '进口水果' },
            { id: '3', name: '有机食品' },
            { id: '4', name: '礼盒套装' }
        ];
        categories = defaultCategories;
        renderCategoryOptions();
    }
}

// 渲染分类下拉选项
function renderCategoryOptions () {
    if (!productCategoryInput) return;

    const options = categories.map(cat =>
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');

    productCategoryInput.innerHTML = `<option value="">请选择分类</option>${options}`;
}

// 加载模拟数据（作为fallback）
function loadMockProducts () {
    console.log('Loading mock products...');
    products = [
        {
            id: '1',
            name: '500g±50g/份【酸甜多汁】高山无籽蜜桔',
            description: '富含维C',
            price: 3.9,
            stock: 100,
            img: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fi2%2F2627785630%2FO1CN01lcFjrQ1rSaXqyoj56_%21%212627785630.jpg&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1701185157&t=01ad96d19c2d890a50e34ea6795390c6',
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now() - 86400000
        },
        {
            id: '2',
            name: '500g±50g/袋【软糯香甜】超甜海南香蕉',
            description: '皮薄肉厚水果熟食纤维细腻',
            price: 2.9,
            stock: 150,
            img: 'https://img1.baidu.com/it/u=520702331,1822653794&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
            createdAt: Date.now() - 43200000,
            updatedAt: Date.now() - 43200000
        }
    ];
    // 按照创建时间倒序排序，新添加的商品显示在最顶部
    products.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt).getTime();
        const dateB = new Date(b.created_at || b.createdAt).getTime();
        return dateB - dateA;
    });
    renderProductList();
}

// 渲染商品列表
function renderProductList (filteredProducts = null) {
    const displayProducts = filteredProducts || products;

    if (displayProducts.length === 0) {
        productListBody.innerHTML = '';
        productsEmptyState.style.display = 'block';
        return;
    }

    productsEmptyState.style.display = 'none';
    productListBody.innerHTML = displayProducts.map(product => `
        <tr>
            <td>${product.id}</td>
    <td>${product.img ? `<img src="${product.img.startsWith('http') ? product.img : API_BASE_URL.replace('/api', '') + product.img}" style="width: 80px; height: 80px; object-fit: cover;">` : '-'}</td>
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td>${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${formatDate(product.created_at || product.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="openEditModal('${product.id}')">编辑</button>
                <button class="btn btn-sm btn-delete" onclick="deleteProduct('${product.id}')">删除</button>
            </td>
        </tr>
    `).join('');
}

// 渲染订单列表
function renderOrderList (filteredOrders = null) {
    const displayOrders = filteredOrders || orders;

    if (displayOrders.length === 0) {
        orderListBody.innerHTML = '';
        ordersEmptyState.style.display = 'block';
        return;
    }

    ordersEmptyState.style.display = 'none';
    orderListBody.innerHTML = displayOrders.map(order => `
        <tr>
        <td>${order.id}</td>
            <td>${order.user_id}</td>
            <td>${parseFloat(order.total_price).toFixed(2)}</td>
            <td>${getStatusText(order.status)}</td>
            <td>${order.shipping_address}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="openOrderDetail('${order.id}')">查看详情</button>
                <button class="btn btn-sm ${order.status < 3 ? 'btn-primary' : 'btn-secondary'}" onclick="updateOrderStatus('${order.id}', ${order.status})" ${order.status >= 3 ? 'disabled' : ''}>${order.status < 3 ? '更新状态' : '已完成'}</button>
            </td>
        </tr>
    `).join('');
}

// 获取订单状态文本
function getStatusText (status) {
    const statusMap = {
        0: '待支付',
        1: '待发货',
        2: '待收货',
        3: '已完成',
        4: '已取消'
    };
    return statusMap[status] || '未知状态';
}

// 查看订单详情
function openOrderDetail (orderId) {
    // 这里可以实现订单详情弹窗
    console.log('Open order detail:', orderId);
    // 后续可以添加订单详情模态框
}


async function updateOrderStatus (orderId, currentStatus) {
    if (currentStatus >= 3) {
        return;
    }

    const newStatus = currentStatus + 1;
    if (confirm(`确定要将订单状态更新为 ${getStatusText(newStatus)} 吗？`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '更新订单状态失败');
            }

            // 重新加载订单数据
            await loadOrders();
            showError('订单状态更新成功', 'success');
        } catch (error) {
            console.error('Error updating order status:', error);
            showError('更新订单状态失败: ' + error.message);
        }
    }
}

// 打开添加商品模态框
function openAddModal () {
    console.log('Opening add modal...');
    isEditing = false;
    currentProductId = null;
    modalTitle.textContent = '添加商品';
    submitBtn.textContent = '添加';
    resetForm();
    modalOverlay.style.display = 'flex';
}

// 打开编辑商品模态框
function openEditModal (productId) {
    isEditing = true;
    currentProductId = productId;
    const product = products.find(p => p.id === productId);

    if (product) {
        modalTitle.textContent = '编辑商品';
        submitBtn.textContent = '更新';

        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productDescriptionInput.value = product.description;
        productPriceInput.value = product.price;
        productOriginalPriceInput.value = product.original_price || product.originalPrice || '';
        productCategoryInput.value = product.category_id || '0';
        productStockInput.value = product.stock;
        productImgInput.value = product.img || '';

        modalOverlay.style.display = 'flex';
    }
}

// 关闭模态框 
function closeModal () {
    modalOverlay.style.display = 'none';
    resetForm();
}

// 重置表单
function resetForm () {
    productForm.reset();
    productIdInput.value = '';
    isEditing = false;
    currentProductId = null;
    productImgFileInput.value = '';
}

// 处理表单提交
async function handleFormSubmit (e) {
    e.preventDefault();
    console.log('Form submitted');

    if (!validateForm()) {
        return;
    }

    const formData = new FormData();
    formData.append('name', productNameInput.value.trim());
    formData.append('description', productDescriptionInput.value.trim());
    formData.append('price', parseFloat(productPriceInput.value));
    formData.append('original_price', parseFloat(productOriginalPriceInput.value) || null);
    formData.append('category_id', productCategoryInput.value || '0');
    formData.append('stock', parseInt(productStockInput.value));

    if (productImgFileInput.files[0]) {
        formData.append('img', productImgFileInput.files[0]);
    } else if (isEditing) {
        formData.append('existingImg', productImgInput.value.trim());
    }

    try {
        let response;
        if (isEditing) {
            response = await fetch(`${API_BASE_URL}/products/${currentProductId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                body: formData
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '操作失败');
        }

        // 重新加载商品数据
        await loadProducts();
        closeModal();
        showError(isEditing ? '商品更新成功' : '商品添加成功', 'success');
    } catch (error) {
        console.error('Error submitting form:', error);
        showError('操作失败: ' + error.message);
    }
}

// 验证表单
function validateForm () {
    const errors = [];

    if (!productNameInput.value.trim()) {
        errors.push('商品名称不能为空');
    }

    if (isNaN(parseFloat(productPriceInput.value)) || parseFloat(productPriceInput.value) <= 0) {
        errors.push('商品价格必须大于0');
    }

    if (isNaN(parseInt(productStockInput.value)) || parseInt(productStockInput.value) < 0) {
        errors.push('库存数量不能为负数');
    }

    if (errors.length > 0) {
        showError(errors.join('\n'));
        return false;
    }

    return true;
}

// 删除商品
async function deleteProduct (productId) {
    if (confirm('确定要删除这个商品吗？')) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除失败');
            }

            // 重新加载商品数据
            await loadProducts();
            showError('商品删除成功', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showError('删除失败: ' + error.message);
        }
    }
}

// 处理商品搜索
function handleSearch () {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
    );
    renderProductList(filteredProducts);
}

// 处理订单搜索
function handleOrderSearch () {
    const searchTerm = orderSearchInput.value.toLowerCase();
    let filteredOrders = orders;

    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order =>
            order.id.toLowerCase().includes(searchTerm)
        );
    }

    // 应用状态筛选
    const statusFilter = orderStatusFilter.value;
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order =>
            order.status === parseInt(statusFilter)
        );
    }

    renderOrderList(filteredOrders);
}

// 处理订单状态筛选
function handleOrderFilter () {
    handleOrderSearch();
}

// 处理图片上传
function handleImageUpload (e) {
    const file = e.target.files[0];
    if (file) {
        // 预览图片
        const reader = new FileReader();
        reader.onload = (e) => {
            productImgInput.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 导出数据
async function exportData () {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to load products');
        }

        const products = await response.json();
        const jsonData = JSON.stringify(products, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showError('数据导出成功', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('导出失败: ' + error.message);
    }
}

// 导入数据
async function importData (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('确定要导入数据吗？这将覆盖现有数据。')) {
                // 由于涉及大量数据操作，建议在后端实现批量导入功能
                // 这里简单实现单个导入
                for (const product of data) {
                    const formData = new FormData();
                    formData.append('name', product.name);
                    formData.append('description', product.description);
                    formData.append('price', product.price);
                    formData.append('stock', product.stock);
                    formData.append('img', product.img);

                    await fetch(`${API_BASE_URL}/products`, {
                        method: 'POST',
                        body: formData
                    });
                }

                // 重新加载商品数据
                await loadProducts();
                showError('数据导入成功', 'success');
                fileInput.value = '';
            }
        } catch (error) {
            console.error('Error importing data:', error);
            showError('导入失败: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// 显示错误信息
function showError (message, type = 'error') {
    errorText.textContent = message;
    errorMessage.style.backgroundColor = type === 'success' ? '#2ecc71' : '#e74c3c';
    errorMessage.style.display = 'flex';

    // 3秒后自动隐藏
    setTimeout(() => {
        hideError();
    }, 3000);
}

// 隐藏错误信息
function hideError () {
    errorMessage.style.display = 'none';
}

// 格式化日期
function formatDate (timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// 数据分析相关函数

// 加载数据分析数据
async function loadAnalyticsData () {
    // 防止函数被多次调用
    if (isLoadingAnalyticsData) {
        return;
    }

    isLoadingAnalyticsData = true;
    console.log('Loading analytics data...');

    try {
        // 并行加载商品和订单数据
        const [productsResponse, ordersResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/products`),
            fetch(`${API_BASE_URL}/orders`)
        ]);

        if (!productsResponse.ok || !ordersResponse.ok) {
            throw new Error('Failed to load analytics data');
        }

        const products = await productsResponse.json();
        const orders = await ordersResponse.json();

        // 计算分析指标并渲染图表
        calculateAnalyticsMetrics(products, orders);

    } catch (error) {
        console.error('Error loading analytics data:', error);
        // 使用模拟数据作为 fallback
        generateMockAnalyticsData();
    } finally {
        // 无论成功还是失败，都要重置标志位
        isLoadingAnalyticsData = false;
    }
}

// 计算数据分析指标
function calculateAnalyticsMetrics (products, orders) {
    console.log('Calculating analytics metrics...');

    // 重新获取数据分析相关DOM元素，确保在标签页切换时能正确获取
    refreshAnalyticsDOM();

    // 1. 计算概览指标
    const totalProductsCount = products.length;
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter(order => order.status === 3);
    const totalSalesAmount = completedOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
    const avgOrderValue = totalSalesAmount / (completedOrders.length || 1);

    // 更新概览卡片
    if (totalProducts) totalProducts.textContent = totalProductsCount;
    if (totalOrders) totalOrders.textContent = totalOrdersCount;
    if (totalSales) totalSales.textContent = formatCurrency(totalSalesAmount);
    if (avgOrderAmount) avgOrderAmount.textContent = formatCurrency(avgOrderValue);

    // 2. 生成订单流量数据（最近7天）
    const last7Days = getLast7Days();
    const orderFlowData = last7Days.map(date => {
        const dayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at || order.createdAt);
            return orderDate.toDateString() === new Date(date).toDateString();
        });
        return {
            date: date,
            count: dayOrders.length
        };
    });

    // 3. 生成商品销售数据
    const productSalesData = products.map(product => {
        // 这里简化处理，实际应该从订单项中统计销量
        // 生成模拟销售数据
        const salesCount = Math.floor(Math.random() * 50) + 1;
        const salesAmount = salesCount * parseFloat(product.price);
        return {
            id: product.id,
            name: product.name,
            salesCount: salesCount,
            salesAmount: salesAmount
        };
    }).sort((a, b) => b.salesAmount - a.salesAmount);

    // 4. 渲染图表
    renderOrderFlowChart(orderFlowData);
    renderProductSalesChart(productSalesData);
    renderSalesDataTable(productSalesData, totalSalesAmount);
}

// 刷新数据分析相关DOM元素
function refreshAnalyticsDOM () {
    console.log('Refreshing analytics DOM elements...');
    // 重新获取数据分析相关元素
    totalProducts = document.getElementById('total-products');
    totalOrders = document.getElementById('total-orders');
    totalSales = document.getElementById('total-sales');
    avgOrderAmount = document.getElementById('avg-order-amount');
    orderFlowChart = document.getElementById('order-flow-chart');
    productSalesChart = document.getElementById('product-sales-chart');
    salesDataBody = document.getElementById('sales-data-body');
    // 分页相关元素
    paginationInfo = document.getElementById('pagination-info');
    prevPageBtn = document.getElementById('prev-page-btn');
    nextPageBtn = document.getElementById('next-page-btn');

    console.log('Refreshed analytics DOM elements:', {
        totalProducts: !!totalProducts,
        totalOrders: !!totalOrders,
        totalSales: !!totalSales,
        avgOrderAmount: !!avgOrderAmount,
        orderFlowChart: !!orderFlowChart,
        productSalesChart: !!productSalesChart,
        salesDataBody: !!salesDataBody,
        paginationInfo: !!paginationInfo,
        prevPageBtn: !!prevPageBtn,
        nextPageBtn: !!nextPageBtn
    });
}

// 渲染订单流量分析图表
function renderOrderFlowChart (orderFlowData) {
    // 移除过多的日志输出

    // 确保canvas元素存在且Chart.js已加载
    if (!orderFlowChart || typeof Chart === 'undefined') {
        return;
    }

    try {
        // 销毁现有图表
        if (orderFlowChartInstance) {
            orderFlowChartInstance.destroy();
        }

        const ctx = orderFlowChart.getContext('2d');

        orderFlowChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: orderFlowData.map(item => item.date),
                datasets: [{
                    label: '订单数量',
                    data: orderFlowData.map(item => item.count),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '订单数量'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '日期'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    } catch (error) {
        // 仅在开发环境输出错误
        if (window.location.hostname === 'localhost') {
            console.error('Error rendering order flow chart:', error);
        }
    }
}

// 渲染商品销售分析图表
function renderProductSalesChart (productSalesData) {
    // 移除过多的日志输出

    // 确保canvas元素存在且Chart.js已加载
    if (!productSalesChart || typeof Chart === 'undefined') {
        return;
    }

    try {
        // 只显示销量前5的商品
        const topProducts = productSalesData.slice(0, 5);

        // 销毁现有图表
        if (productSalesChartInstance) {
            productSalesChartInstance.destroy();
        }

        const ctx = productSalesChart.getContext('2d');

        productSalesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topProducts.map(item => item.name),
                datasets: [{
                    label: '销售金额',
                    data: topProducts.map(item => item.salesAmount),
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#f39c12',
                        '#e74c3c',
                        '#9b59b6'
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '销售金额 (元)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '商品名称'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        // 仅在开发环境输出错误
        if (window.location.hostname === 'localhost') {
            console.error('Error rendering product sales chart:', error);
        }
    }
}

// 渲染销售数据表格（支持分页）
function renderSalesDataTable (productSalesData, totalSalesAmount) {
    console.log('Rendering sales data table with pagination...');

    // 确保salesDataBody存在
    if (!salesDataBody) {
        console.warn('salesDataBody not found, skipping table rendering');
        return;
    }

    // 存储完整数据用于分页
    salesData = productSalesData;

    // 计算总页数
    totalPages = Math.ceil(salesData.length / ITEMS_PER_PAGE);
    totalPages = totalPages > 0 ? totalPages : 1;

    // 确保当前页码在有效范围内
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    // 更新分页信息显示
    updatePaginationInfo();
    updatePaginationButtons();

    // 获取当前页的数据
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageData = salesData.slice(startIndex, endIndex);

    if (currentPageData.length === 0) {
        salesDataBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">暂无销售数据</td></tr>';
        return;
    }

    salesDataBody.innerHTML = currentPageData.map(product => {
        const percentage = totalSalesAmount > 0 ? ((product.salesAmount / totalSalesAmount) * 100).toFixed(1) : '0.0';
        return `
            <tr>
                <td>${product.name}</td>
                <td>${product.salesCount}</td>
                <td>${formatCurrency(product.salesAmount)}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    }).join('');
}

// 更新分页信息显示
function updatePaginationInfo () {
    if (!paginationInfo) return;
    paginationInfo.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
}

// 更新分页按钮状态
function updatePaginationButtons () {
    if (!prevPageBtn || !nextPageBtn) return;

    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// 上一页
function handlePrevPage () {
    if (currentPage > 1) {
        currentPage--;
        renderSalesDataTable(salesData, salesData.reduce((sum, p) => sum + p.salesAmount, 0));
        scrollToTableTop();
    }
}

// 下一页
function handleNextPage () {
    if (currentPage < totalPages) {
        currentPage++;
        renderSalesDataTable(salesData, salesData.reduce((sum, p) => sum + p.salesAmount, 0));
        scrollToTableTop();
    }
}

// 滚动到表格顶部
function scrollToTableTop () {
    const tableSection = document.querySelector('.analytics-table-section');
    if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 生成模拟数据分析数据（用于演示）
function generateMockAnalyticsData () {
    console.log('Generating mock analytics data...');

    // 模拟商品数据
    const mockProducts = [
        { id: '1', name: '商品A', price: '100.00' },
        { id: '2', name: '商品B', price: '200.00' },
        { id: '3', name: '商品C', price: '150.00' },
        { id: '4', name: '商品D', price: '300.00' },
        { id: '5', name: '商品E', price: '250.00' }
    ];

    // 模拟订单数据
    const mockOrders = Array.from({ length: 50 }, (_, i) => ({
        id: `order-${i + 1}`,
        status: 3, // 已完成
        total_price: (Math.random() * 1000 + 100).toFixed(2),
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    // 重新获取DOM元素，确保在使用模拟数据时能正确获取
    refreshAnalyticsDOM();

    // 检查DOM元素是否存在，只有存在时才渲染数据
    if (salesDataBody) {
        // 使用模拟数据计算指标
        calculateAnalyticsMetrics(mockProducts, mockOrders);
    } else {
        console.warn('salesDataBody not found, skipping mock analytics data generation');
    }
}

// 辅助函数：格式化货币
function formatCurrency (amount) {
    return `¥${parseFloat(amount).toFixed(2)}`;
}

// 辅助函数：获取最近7天的日期
function getLast7Days () {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        days.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    }

    return days;
}