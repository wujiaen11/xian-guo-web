// 商品管理系统 - 原生JavaScript实现

// 全局变量
let products = [];
let orders = [];
let categories = [];
let selectedOrderIds = new Set();
let currentProductId = null;
let isEditing = false;
let isLoadingAnalyticsData = false;
let isAuthenticated = false;
// 加载状态元素
let productsLoading;
let ordersLoading;
let analyticsLoading;
// 使用环境变量或默认值，支持Vercel部署
const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL)
    ? process.env.API_BASE_URL
    : (window.ENV && window.ENV.API_BASE_URL)
        ? window.ENV.API_BASE_URL
        : 'https://xianguo-217100-7-1320842230.sh.run.tcloudbase.com/api';

// 确保API_BASE_URL不以'/api'结尾（用于图片路径等）
const API_BASE_URL_CLEAN = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// 从环境变量获取管理员账号，支持微信云托管
const ADMIN_CREDENTIALS = {
    username: (typeof process !== 'undefined' && process.env && process.env.ADMIN_USERNAME)
        ? process.env.ADMIN_USERNAME
        : (window.ENV && window.ENV.ADMIN_USERNAME)
            ? window.ENV.ADMIN_USERNAME
            : 'admin',
    password: (typeof process !== 'undefined' && process.env && process.env.ADMIN_PASSWORD)
        ? process.env.ADMIN_PASSWORD
        : (window.ENV && window.ENV.ADMIN_PASSWORD)
            ? window.ENV.ADMIN_PASSWORD
            : 'admin123'
};

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
let emptyAddBtn;
// 登录相关DOM元素
let loginForm;
let usernameInput;
let passwordInput;
let adminPanel;
// 订单相关DOM元素
let tabBtns;

let productsPage;
let ordersPage;
let analyticsPage;
let orderSearchInput;
let orderStatusFilter;
let orderListBody;
let ordersEmptyState;
// 数据分析相关DOM元素
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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    getDOMElements();
    bindEvents();

    // 检查是否已经登录
    checkAuthentication();

    // 如果已登录，根据用户类型决定显示内容
    if (isAuthenticated) {
        let userType = 'user';
        try {
            userType = localStorage.getItem('userType') || 'user';
        } catch (error) {
            console.warn('localStorage access blocked, using default user type:', error);
            try {
                userType = window.sessionStorage && sessionStorage.getItem('userType') || 'user';
            } catch (sessionError) {
                console.warn('sessionStorage access also blocked:', sessionError);
            }
        }
        if (userType === 'admin') {
            // 管理员登录，显示管理面板
            await loadInitialData();
            showAdminPanel();
        } else {
            // 普通用户登录，显示首页
            await loadHomePageProducts();
        }
    } else {
        // 未登录，加载首页产品数据
        await loadHomePageProducts();
    }
});

// 加载初始数据
async function loadInitialData () {
    console.log('Loading initial data...');

    // 并行加载所有初始数据
    const results = await Promise.allSettled([
        loadProducts(),
        loadCategories(),
        loadOrders()
    ]);

    // 检查是否所有请求都失败
    const allFailed = results.every(result => result.status === 'rejected');

    if (allFailed) {
        console.error('All API requests failed');
        showError('所有API请求都失败了，请检查网络连接或API地址配置');
    }
}

// 获取DOM元素
function getDOMElements () {
    console.log('Getting DOM elements...');
    // 登录相关元素
    loginForm = document.getElementById('login-form');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    adminPanel = document.getElementById('admin-panel');

    // 注册相关元素
    registerForm = document.getElementById('register-form');
    registerUsernameInput = document.getElementById('register-username');
    registerPasswordInput = document.getElementById('register-password');
    registerConfirmPasswordInput = document.getElementById('register-confirm-password');

    // 首页相关元素
    adminLoginBtn = document.querySelector('.admin-login-btn');
    adminLoginModal = document.getElementById('admin-login-modal');
    closeLoginModal = document.getElementById('close-login-modal');
    productList = document.getElementById('product-list');
    heroArea = document.querySelector('.hero_area');
    bg = document.querySelector('.bg');
    contactSection = document.querySelector('.contact_section');
    infoSection = document.querySelector('.info_section');
    footerSection = document.querySelector('.footer_section');

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
    productsLoading = document.getElementById('products-loading');

    errorMessage = document.getElementById('error-message');
    errorText = document.getElementById('error-text');
    emptyAddBtn = document.getElementById('empty-add-btn');

    // 订单相关元素
    tabBtns = document.querySelectorAll('.tab-btn');

    productsPage = document.getElementById('products-page');
    ordersPage = document.getElementById('orders-page');
    analyticsPage = document.getElementById('analytics-page');
    orderSearchInput = document.getElementById('order-search-input');
    orderStatusFilter = document.getElementById('order-status-filter');
    orderListBody = document.getElementById('order-list-body');
    ordersEmptyState = document.getElementById('orders-empty-state');
    ordersLoading = document.getElementById('orders-loading');
    analyticsLoading = document.getElementById('analytics-loading');

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
        tabBtns: tabBtns ? tabBtns.length : 0,
        ordersPage: !!ordersPage,
        analyticsPage: !!analyticsPage,
        orderListBody: !!orderListBody,
        ordersEmptyState: !!ordersEmptyState,
        orders: orders.length
    });
}

// 绑定事件
function bindEvents () {
    console.log('Binding events...');

    // 首页管理员登录按钮事件
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
        console.log('Admin login button event bound');
    }

    // 登录模态框关闭事件
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', closeLoginModalFunc);
    }

    if (adminLoginModal) {
        adminLoginModal.addEventListener('click', (e) => {
            if (e.target === adminLoginModal) {
                closeLoginModalFunc();
            }
        });
    }

    // 模态框事件
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddModal);
        console.log('Add product button event bound');
    }

    if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', openAddModal);
        console.log('Empty add button event bound');
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
        btn.style.background = 'rgba(0, 0, 0, 0.1)';
    });
    e.target.classList.add('active');
    e.target.style.background = 'rgba(0, 0, 0, 0.3)';

    // 切换页面内容
    if (tabName === 'products') {
        productsPage.style.display = 'block';
        ordersPage.style.display = 'none';
        analyticsPage.style.display = 'none';
        // 重新加载商品数据
        loadProducts();
    } else if (tabName === 'orders') {
        productsPage.style.display = 'none';
        ordersPage.style.display = 'block';
        analyticsPage.style.display = 'none';
        // 加载订单数据
        loadOrders();
    } else if (tabName === 'analytics') {
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
    // 显示加载状态
    if (productsLoading) {
        productsLoading.style.display = 'flex';
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(`${API_BASE_URL_CLEAN}/api/products`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        products = await response.json();
        console.log('Products loaded successfully:', products);
        // 按照创建时间倒序排序，新添加的商品显示在最顶部
        products.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt).getTime();
            const dateB = new Date(b.created_at || b.createdAt).getTime();
            return dateB - dateA;
        });
        renderProductList();
        return true;
    } catch (error) {
        console.error('Error loading products:', error);
        // 不直接显示错误，使用空数据作为fallback
        loadEmptyProducts();
        return false;
    } finally {
        // 隐藏加载状态
        if (productsLoading) {
            productsLoading.style.display = 'none';
        }
    }
}

// 加载订单数据
async function loadOrders () {
    console.log('Loading orders from API...');
    // 清空之前的选择
    selectedOrderIds.clear();
    // 显示加载状态
    if (ordersLoading) {
        ordersLoading.style.display = 'flex';
    }
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(`${API_BASE_URL_CLEAN}/api/orders`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Failed to load orders');
        }
        orders = await response.json();
        console.log('Orders loaded successfully:', orders);
        // 如果API返回空数组，也加载空数据
        if (orders.length === 0) {
            console.log('API returned empty orders array, loading empty orders...');
            loadEmptyOrders();
        } else {
            renderOrderList();
        }
        updateBatchDeleteButton();
        return true;
    } catch (error) {
        console.error('Error loading orders:', error);
        // 不直接显示错误，使用空数据作为fallback
        loadEmptyOrders();
        return false;
    } finally {
        // 隐藏加载状态
        if (ordersLoading) {
            ordersLoading.style.display = 'none';
        }
    }
}

function loadEmptyOrders () {
    console.log('Loading empty orders...');
    orders = [];
    selectedOrderIds.clear();
    renderOrderList();
    updateBatchDeleteButton();
}

// 加载分类数据
async function loadCategories () {
    console.log('Loading categories from API...');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(`${API_BASE_URL_CLEAN}/api/categories`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Failed to load categories');
        }
        categories = await response.json();
        console.log('Categories loaded successfully:', categories);
        renderCategoryOptions();
        return true;
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
        return false;
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

// 加载空数据（作为fallback）
function loadEmptyProducts () {
    console.log('Loading empty products...');
    products = [];
    renderProductList();
}

// 渲染商品列表
function renderProductList (filteredProducts = null) {
    // 确保DOM元素存在
    if (!productListBody || !productsEmptyState) {
        console.warn('Product list DOM elements not found, re-getting...');
        getDOMElements();
        // 如果仍然不存在，返回
        if (!productListBody || !productsEmptyState) {
            console.error('Product list DOM elements still not found');
            return;
        }
    }

    const displayProducts = filteredProducts || products;

    if (displayProducts.length === 0) {
        productListBody.innerHTML = '';
        productsEmptyState.style.display = 'flex';
        return;
    }

    productsEmptyState.style.display = 'none';
    productListBody.innerHTML = displayProducts.map(product => `
        <tr>
            <td>${product.id}</td>
    <td>${product.img ? `<img src="${product.img.startsWith('http') || product.img.startsWith('data:') ? product.img : API_BASE_URL_CLEAN + product.img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;80&quot; height=&quot;80&quot; viewBox=&quot;0 0 80 80&quot;><rect width=&quot;80&quot; height=&quot;80&quot; fill=&quot;#f0f0f0&quot;/></svg>');">` : '-'}</td>
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td>¥${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>${formatDate(product.created_at || product.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-edit" onclick="openEditModal('${product.id}')">
                    <i class="fas fa-edit"></i>
                    <span>编辑</span>
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                    <span>删除</span>
                </button>
            </td>
        </tr>
    `).join('');
}

// 渲染订单列表
function renderOrderList (filteredOrders = null) {
    // 确保DOM元素已正确获取
    if (!orderListBody || !ordersEmptyState) {
        console.error('Order list DOM elements not found, re-getting...');
        getDOMElements();
        // 如果仍然不存在，返回
        if (!orderListBody || !ordersEmptyState) {
            console.error('Order list DOM elements still not found');
            return;
        }
    }

    const displayOrders = filteredOrders || orders;
    console.log('Rendering order list with orders:', displayOrders);

    if (displayOrders.length === 0) {
        orderListBody.innerHTML = '';
        ordersEmptyState.style.display = 'flex';
        return;
    }

    ordersEmptyState.style.display = 'none';
    orderListBody.innerHTML = displayOrders.map(order => {
        // 确保 status 是数字类型
        let orderStatus = order.status;
        if (typeof orderStatus === 'string') {
            // 如果是字符串，尝试转换为数字
            if (order.statusCode !== undefined) {
                orderStatus = order.statusCode;
            } else {
                // 根据状态文本映射回数字
                const statusMap = {
                    '待发货': 0,
                    '进行中': 1,
                    '已收货': 2,
                    '已评价': 3
                };
                orderStatus = statusMap[orderStatus] !== undefined ? statusMap[orderStatus] : 0;
            }
        }
        // 计算商品总数
        let productCount = 0;
        let firstProduct = null;
        if (order.products && order.products.length > 0) {
            productCount = order.products.reduce((sum, p) => sum + (p.quantity || p.num || 0), 0);
            firstProduct = order.products[0];
        }
        const isChecked = selectedOrderIds.has(order.id);
        return `
        <tr>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">
                <input type="checkbox" class="order-checkbox" data-order-id="${order.id}" ${isChecked ? 'checked' : ''} onchange="toggleOrderSelection('${order.id}')" style="cursor: pointer;">
            </td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${firstProduct && firstProduct.img ? `<img src="${firstProduct.img.startsWith('http') || firstProduct.img.startsWith('data:') ? firstProduct.img : API_BASE_URL_CLEAN + firstProduct.img}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;50&quot; height=&quot;50&quot; viewBox=&quot;0 0 50 50&quot;><rect width=&quot;50&quot; height=&quot;50&quot; fill=&quot;#f0f0f0&quot;/></svg>');">` : ''}
                    <div>
                        <div style="font-weight: 500; color: #333;">${firstProduct ? firstProduct.name : '暂无商品'}</div>
                        <div style="font-size: 12px; color: #999;">${order.id}</div>
                    </div>
                </div>
            </td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">${order.contact_name || order.user_id}</td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">${productCount} 件</td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">¥${parseFloat(order.total_price).toFixed(2)}</td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">${typeof order.status === 'string' ? order.status : getStatusText(orderStatus)}</td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">${order.shipping_address}</td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">${formatDate(order.created_at)}</td>
            <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">
                ${orderStatus === 0 ? `
                <button class="btn btn-sm btn-edit" onclick="shipOrder('${order.id}')">
                    <i class="fas fa-shipping-fast"></i>
                    <span>发货</span>
                </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}')">
                    <i class="fas fa-trash"></i>
                    <span>删除</span>
                </button>
            </td>
        </tr>
    `}).join('');
}

// 获取订单状态文本 - 与服务端统一状态映射保持一致
function getStatusText (status) {
    const statusMap = {
        0: '待发货',
        1: '进行中',
        2: '已收货',
        3: '已评价'
    };
    return statusMap[status] || '未知状态';
}

// 商家发货功能
async function shipOrder (orderId) {
    if (confirm('确定要发货吗？')) {
        try {
            const url = `${API_BASE_URL_CLEAN}/api/orders/${orderId}/status`;
            const data = { status: 1 }; // 状态1表示进行中
            console.log('发货，更新订单状态为进行中:', { orderId, url });

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('发货响应:', { status: response.status, ok: response.ok });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('发货失败:', errorData);
                throw new Error(errorData.error || '发货失败');
            }

            const result = await response.json();
            console.log('发货成功:', result);

            // 重新加载订单数据
            await loadOrders();
            showError('发货成功，订单已进入进行中状态', 'success');
        } catch (error) {
            console.error('Error shipping order:', error);
            showError('发货失败: ' + error.message);
        }
    }
}

// 查看订单详情
function openOrderDetail (orderId) {
    console.log('Open order detail:', orderId);
    // 查找订单
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showError('订单不存在');
        return;
    }

    // 创建订单详情模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    `;

    // 构建订单详情HTML
    let orderDetailsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>订单详情</h2>
            <button onclick="this.closest('div').remove();" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        <div style="margin-bottom: 15px;">
            <strong>订单ID:</strong> ${order.id}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>联系人:</strong> ${order.contact_name || order.user_id}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>总金额:</strong> ¥${parseFloat(order.total_price).toFixed(2)}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>状态:</strong> ${getStatusText(order.status)}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>收货地址:</strong> ${order.shipping_address}
        </div>
        <div style="margin-bottom: 15px;">
            <strong>创建时间:</strong> ${formatDate(order.created_at)}
        </div>
    `;

    // 如果有商品信息，添加商品列表
    if (order.products && order.products.length > 0) {
        orderDetailsHTML += `
            <div style="margin-top: 20px; margin-bottom: 15px;">
                <strong>商品信息:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
        `;

        order.products.forEach(product => {
            orderDetailsHTML += `
                <li style="margin-bottom: 5px;">
                    ${product.name} × ${product.quantity} - ¥${(product.price * product.quantity).toFixed(2)}
                </li>
            `;
        });

        orderDetailsHTML += `
                </ul>
            </div>
        `;
    }

    modalContent.innerHTML = orderDetailsHTML;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}


async function updateOrderStatus (orderId, currentStatus) {
    if (currentStatus >= 3) {
        return;
    }

    const newStatus = currentStatus + 1;
    if (confirm(`确定要将订单状态更新为 ${getStatusText(newStatus)} 吗？`)) {
        try {
            const url = `${API_BASE_URL_CLEAN}/api/orders/${orderId}/status`;
            const data = { status: newStatus };
            console.log('Updating order status:', { orderId, currentStatus, newStatus, url });

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log('Update order status response:', { status: response.status, ok: response.ok });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Update order status error:', errorData);
                throw new Error(errorData.error || '更新订单状态失败');
            }

            const result = await response.json();
            console.log('Update order status success:', result);

            // 重新加载订单数据
            await loadOrders();
            showError('订单状态更新成功', 'success');
        } catch (error) {
            console.error('Error updating order status:', error);
            showError('更新订单状态失败: ' + error.message);
        }
    }
}

// 删除订单
async function deleteOrder (orderId) {
    if (confirm('确定要删除这个订单吗？此操作不可恢复。')) {
        try {
            const url = `${API_BASE_URL_CLEAN}/api/orders/${orderId}`;
            console.log('Deleting order:', { orderId, url });

            const response = await fetch(url, {
                method: 'DELETE'
            });

            console.log('Delete order response:', { status: response.status, ok: response.ok });

            if (!response.ok) {
                let errorMessage = '删除订单失败';
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } else {
                        const text = await response.text();
                        console.error('Server returned non-JSON response:', text);
                        errorMessage = `删除订单失败 (HTTP ${response.status})`;
                    }
                } catch (parseErr) {
                    console.error('Error parsing error response:', parseErr);
                    errorMessage = `删除订单失败 (HTTP ${response.status})`;
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    result = await response.json();
                }
            } catch (parseErr) {
                console.log('Response is not JSON, continuing anyway');
            }

            console.log('Delete order success:', result);

            // 重新加载订单数据
            await loadOrders();
            showError('订单删除成功', 'success');
        } catch (error) {
            console.error('Error deleting order:', error);
            showError('删除订单失败: ' + error.message);
        }
    }
}

// 切换单个订单选择状态
function toggleOrderSelection (orderId) {
    if (selectedOrderIds.has(orderId)) {
        selectedOrderIds.delete(orderId);
    } else {
        selectedOrderIds.add(orderId);
    }
    updateSelectAllCheckbox();
    updateBatchDeleteButton();
}

// 全选/取消全选订单
function toggleSelectAllOrders () {
    const selectAllCheckbox = document.getElementById('select-all-orders');
    const isChecked = selectAllCheckbox.checked;

    const displayOrders = orders;
    if (isChecked) {
        displayOrders.forEach(order => selectedOrderIds.add(order.id));
    } else {
        selectedOrderIds.clear();
    }

    renderOrderList();
    updateBatchDeleteButton();
}

// 更新全选复选框状态
function updateSelectAllCheckbox () {
    const selectAllCheckbox = document.getElementById('select-all-orders');
    if (!selectAllCheckbox) return;

    const displayOrders = orders;
    const allSelected = displayOrders.length > 0 && displayOrders.every(order => selectedOrderIds.has(order.id));
    selectAllCheckbox.checked = allSelected;
}

// 更新批量删除按钮显示状态
function updateBatchDeleteButton () {
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    if (!batchDeleteBtn) return;

    batchDeleteBtn.style.display = selectedOrderIds.size > 0 ? 'block' : 'none';
}

// 批量删除订单
async function batchDeleteOrders () {
    if (selectedOrderIds.size === 0) {
        showError('请先选择要删除的订单');
        return;
    }

    if (!confirm(`确定要删除选中的 ${selectedOrderIds.size} 个订单吗？此操作不可恢复。`)) {
        return;
    }

    try {
        const deletePromises = Array.from(selectedOrderIds).map(async orderId => {
            const url = `${API_BASE_URL_CLEAN}/api/orders/${orderId}`;
            const response = await fetch(url, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`删除订单 ${orderId} 失败`);
            }
            return orderId;
        });

        await Promise.all(deletePromises);

        // 清空选择
        selectedOrderIds.clear();

        // 重新加载订单数据
        await loadOrders();
        updateBatchDeleteButton();
        showError(`成功删除 ${deletePromises.length} 个订单`, 'success');
    } catch (error) {
        console.error('批量删除订单失败:', error);
        showError('批量删除订单失败: ' + error.message);
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
    console.log('Form submitted', { isEditing, currentProductId });

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
        const url = isEditing ? `${API_BASE_URL_CLEAN}/api/products/${currentProductId}` : `${API_BASE_URL_CLEAN}/api/products`;
        const method = isEditing ? 'PUT' : 'POST';

        console.log('Sending form data:', { url, method });

        response = await fetch(url, {
            method: method,
            body: formData
        });

        console.log('Form submission response:', { status: response.status, ok: response.ok });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Form submission error:', errorData);
            throw new Error(errorData.error || '操作失败');
        }

        const result = await response.json();
        console.log('Form submission success:', result);

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
            const url = `${API_BASE_URL_CLEAN}/api/products/${productId}`;
            console.log('Deleting product:', { productId, url });

            const response = await fetch(url, {
                method: 'DELETE'
            });

            console.log('Delete product response:', { status: response.status, ok: response.ok });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Delete product error:', errorData);
                throw new Error(errorData.error || '删除失败');
            }

            const result = await response.json();
            console.log('Delete product success:', result);

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
        filteredOrders = filteredOrders.filter(order => {
            // 搜索订单ID或商品名称
            const matchOrderId = order.id.toLowerCase().includes(searchTerm);
            const matchProductName = order.products && order.products.some(p =>
                p.name && p.name.toLowerCase().includes(searchTerm)
            );
            return matchOrderId || matchProductName;
        });
    }

    // 应用状态筛选
    const statusFilter = orderStatusFilter.value;
    if (statusFilter) {
        const statusInt = parseInt(statusFilter);
        filteredOrders = filteredOrders.filter(order => {
            // 处理不同格式的状态值
            if (typeof order.status === 'number') {
                return order.status === statusInt;
            } else if (typeof order.status === 'string') {
                // 尝试将字符串状态转换为数字 - 与统一状态映射保持一致
                const statusStr = order.status;
                if (statusStr === '待发货') return statusInt === 0;
                if (statusStr === '进行中') return statusInt === 1;
                if (statusStr === '已收货') return statusInt === 2;
                if (statusStr === '已评价') return statusInt === 3;
                return false;
            } else if (order.statusCode !== undefined) {
                // 使用 statusCode 字段
                return order.statusCode === statusInt;
            }
            return false;
        });
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
        // 不设置base64到input，避免发送过长数据到服务器
        // 预览可以在其他地方实现，但我们这里直接保留文件上传方式
        console.log('Image file selected for upload:', file.name);
    }
}



// 显示错误信息
function showError (message, type = 'error') {
    errorText.textContent = message;
    errorMessage.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
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
    // 显示加载状态
    if (analyticsLoading) {
        analyticsLoading.style.display = 'flex';
    }

    try {
        // 检查是否在本地服务器环境
        if (window.location.protocol === 'file:') {
            console.warn('Running in file:// protocol, using empty data directly');
            // 直接使用空数据
            generateEmptyAnalyticsData();
        } else {
            // 为每个请求添加超时控制
            const controller1 = new AbortController();
            const controller2 = new AbortController();
            const timeoutId = setTimeout(() => {
                controller1.abort();
                controller2.abort();
            }, 5000); // 5秒超时

            // 并行加载商品和订单数据
            const [productsResponse, ordersResponse] = await Promise.all([
                fetch(`${API_BASE_URL_CLEAN}/api/products`, { signal: controller1.signal }),
                fetch(`${API_BASE_URL_CLEAN}/api/orders`, { signal: controller2.signal })
            ]);

            clearTimeout(timeoutId);

            if (!productsResponse.ok || !ordersResponse.ok) {
                throw new Error('Failed to load analytics data');
            }

            const products = await productsResponse.json();
            const orders = await ordersResponse.json();
            console.log('Analytics data loaded successfully:', { products: products.length, orders: orders.length });

            // 计算分析指标并渲染图表
            calculateAnalyticsMetrics(products, orders);
        }
    } catch (error) {
        console.error('Error loading analytics data:', error);
        // 使用空数据作为 fallback
        generateEmptyAnalyticsData();
    } finally {
        // 无论成功还是失败，都要重置标志位
        isLoadingAnalyticsData = false;
        // 隐藏加载状态
        if (analyticsLoading) {
            analyticsLoading.style.display = 'none';
        }
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
    if (totalSales) totalSales.textContent = `¥${totalSalesAmount.toFixed(2)}`;
    if (avgOrderAmount) avgOrderAmount.textContent = `¥${avgOrderValue.toFixed(2)}`;

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
        const salesCount = 0;
        const salesAmount = 0;
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
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
                        '#4CAF50',
                        '#2196F3',
                        '#FF9800',
                        '#9C27B0',
                        '#F44336'
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

    // 确保DOM元素存在
    if (!salesDataBody) {
        console.warn('salesDataBody not found, re-getting...');
        refreshAnalyticsDOM();
        // 如果仍然不存在，返回
        if (!salesDataBody) {
            console.error('salesDataBody still not found');
            return;
        }
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

    // 清空表格内容，避免无限添加
    salesDataBody.innerHTML = '';

    // 限制最多显示10行数据
    const limitedData = currentPageData.slice(0, 10);

    // 添加当前页数据
    limitedData.forEach(product => {
        const percentage = totalSalesAmount > 0 ? ((product.salesAmount / totalSalesAmount) * 100).toFixed(1) : '0.0';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.salesCount}</td>
            <td>¥${product.salesAmount.toFixed(2)}</td>
            <td>${percentage}%</td>
        `;
        salesDataBody.appendChild(row);
    });
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

// 生成空数据分析数据（用于演示）
function generateEmptyAnalyticsData () {
    console.log('Generating empty analytics data...');

    // 使用空数组
    const emptyProducts = [];
    const emptyOrders = [];

    // 重新获取DOM元素，确保在使用空数据时能正确获取
    refreshAnalyticsDOM();

    // 检查DOM元素是否存在，只有存在时才渲染数据
    if (salesDataBody) {
        // 使用空数据计算指标
        calculateAnalyticsMetrics(emptyProducts, emptyOrders);
    } else {
        console.warn('salesDataBody not found, skipping empty analytics data generation');
    }
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

// 登录相关函数

// 处理登录表单提交
async function handleLogin (e) {
    e.preventDefault();
    console.log('Login form submitted');

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showError('请输入用户名和密码');
        return;
    }

    // 验证用户凭据（包括管理员和普通用户）
    // 这里简化处理，实际应该从后端验证
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // 管理员登录成功
        isAuthenticated = true;
        try {
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('userType', 'admin');
        } catch (error) {
            console.warn('localStorage access blocked, using in-memory storage:', error);
            // 使用内存存储作为降级方案
            window.sessionStorage && sessionStorage.setItem('isAuthenticated', 'true');
            window.sessionStorage && sessionStorage.setItem('username', username);
            window.sessionStorage && sessionStorage.setItem('userType', 'admin');
        }

        // 更新导航栏显示为用户名
        updateNavbarUserInfo(username);

        // 加载管理系统内容
        showAdminPanel();
        await loadInitialData();
        showError('登录成功', 'success');
        closeLoginModalFunc();
    } else {
        // 从localStorage获取已注册用户
        let registeredUsers = [];
        try {
            registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        } catch (error) {
            console.warn('localStorage access blocked, using empty user list:', error);
        }

        const userExists = registeredUsers.some(user => user.username === username && user.password === password);

        if (userExists) {
            // 普通用户登录成功
            isAuthenticated = true;
            try {
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('username', username);
                localStorage.setItem('userType', 'user');
            } catch (error) {
                console.warn('localStorage access blocked, using in-memory storage:', error);
                // 使用内存存储作为降级方案
                window.sessionStorage && sessionStorage.setItem('isAuthenticated', 'true');
                window.sessionStorage && sessionStorage.setItem('username', username);
                window.sessionStorage && sessionStorage.setItem('userType', 'user');
            }

            // 更新导航栏显示为用户名
            updateNavbarUserInfo(username);

            showError('登录成功', 'success');
            closeLoginModalFunc();
        } else {
            // 登录失败
            showError('用户名或密码错误或未注册');
        }
    }
}

// 处理注册表单提交
async function handleRegister (e) {
    e.preventDefault();
    console.log('Register form submitted');

    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value.trim();
    const confirmPassword = registerConfirmPasswordInput.value.trim();

    if (!username || !password || !confirmPassword) {
        showError('请填写所有字段');
        return;
    }

    if (password !== confirmPassword) {
        showError('两次输入的密码不一致');
        return;
    }

    // 从localStorage获取已注册用户
    let registeredUsers = [];
    try {
        registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    } catch (error) {
        console.warn('localStorage access blocked, using empty user list:', error);
    }

    // 检查用户名是否已存在
    if (registeredUsers.some(user => user.username === username)) {
        showError('用户名已存在');
        return;
    }

    // 存储新用户到localStorage
    registeredUsers.push({ username, password });
    try {
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    } catch (error) {
        console.warn('localStorage access blocked, registration data not saved:', error);
        showError('注册成功，但由于浏览器限制，数据可能无法持久保存', 'success');
        // 继续执行，因为即使数据不持久化，注册过程本身是成功的
    }

    showError('注册成功，请登录', 'success');

    // 切换到登录标签页
    document.getElementById('login-tab').click();

    // 清空注册表单
    registerForm.reset();
}

// 检查是否已经登录
function checkAuthentication () {
    try {
        const storedAuth = localStorage.getItem('isAuthenticated');
        isAuthenticated = storedAuth === 'true';

        // 如果已登录，更新导航栏显示为用户名
        if (isAuthenticated) {
            const username = localStorage.getItem('username');
            if (username) {
                updateNavbarUserInfo(username);
            }
        }
    } catch (error) {
        console.warn('localStorage access blocked, using in-memory storage:', error);
        // 使用内存存储作为降级方案
        if (!window.sessionStorage) {
            console.warn('Both localStorage and sessionStorage are blocked');
        }
    }
}

// 更新导航栏用户信息
function updateNavbarUserInfo (username) {
    const loginLink = document.querySelector('.admin-login-btn');
    if (loginLink) {
        // 保存原始用户名
        loginLink.dataset.username = username;
        loginLink.textContent = username;
        loginLink.title = `欢迎，${username}`;
        loginLink.style.color = '#fff';
        loginLink.style.fontWeight = 'bold';

        // 移除之前的事件监听器
        loginLink.removeEventListener('mouseenter', handleMouseEnter);
        loginLink.removeEventListener('mouseleave', handleMouseLeave);
        loginLink.removeEventListener('click', handleLogoutClick);

        // 添加鼠标悬停事件
        loginLink.addEventListener('mouseenter', handleMouseEnter);
        loginLink.addEventListener('mouseleave', handleMouseLeave);
        loginLink.addEventListener('click', handleLogoutClick);
    }
}

// 处理鼠标悬停事件
function handleMouseEnter (e) {
    const loginLink = e.target;
    loginLink.textContent = '退出登录';
    loginLink.title = '点击退出登录';
}

// 处理鼠标离开事件
function handleMouseLeave (e) {
    const loginLink = e.target;
    const username = loginLink.dataset.username;
    if (username) {
        loginLink.textContent = username;
        loginLink.title = `欢迎，${username}`;
    }
}

// 处理退出登录点击事件
function handleLogoutClick (e) {
    e.preventDefault();
    logout();
}

// 退出登录
function logout () {
    console.log('开始执行退出登录函数');

    isAuthenticated = false;
    console.log('设置 isAuthenticated 为 false');

    try {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('username');
        localStorage.removeItem('userType');
        console.log('清除本地存储中的用户信息');
    } catch (error) {
        console.warn('localStorage access blocked, cannot clear storage:', error);
        // 尝试使用sessionStorage作为降级方案
        try {
            window.sessionStorage && sessionStorage.removeItem('isAuthenticated');
            window.sessionStorage && sessionStorage.removeItem('username');
            window.sessionStorage && sessionStorage.removeItem('userType');
            console.log('清除会话存储中的用户信息');
        } catch (sessionError) {
            console.warn('sessionStorage access also blocked:', sessionError);
        }
    }

    // 关闭登录模态框
    closeLoginModalFunc();
    console.log('关闭登录模态框');

    // 恢复导航栏显示为"用户登录"
    const loginLink = document.querySelector('.admin-login-btn');
    if (loginLink) {
        console.log('找到导航栏登录链接');
        loginLink.textContent = '用户登录';
        loginLink.title = '用户登录';
        loginLink.style.color = '';
        loginLink.style.fontWeight = '';

        // 移除事件监听器
        loginLink.removeEventListener('mouseenter', handleMouseEnter);
        loginLink.removeEventListener('mouseleave', handleMouseLeave);
        loginLink.removeEventListener('click', handleLogoutClick);

        // 恢复原始点击事件（打开登录模态框）
        loginLink.addEventListener('click', function (e) {
            e.preventDefault();
            openLoginModal();
        });
        console.log('恢复导航栏为用户登录');
    } else {
        console.log('未找到导航栏登录链接');
    }

    // 隐藏管理面板，显示首页内容
    hideAdminPanel();
    console.log('隐藏管理面板，显示首页内容');

    // 显示退出登录成功消息
    showError('已成功退出登录', 'success');
    console.log('显示退出登录成功消息');
}

// 打开登录模态框
function openLoginModal () {
    if (adminLoginModal) {
        // 关闭导航下拉菜单
        const navbarCollapse = document.getElementById('navbarSupportedContent');
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            navbarCollapse.classList.remove('show');
        }

        // 检查用户是否已登录
        checkAuthentication();

        if (isAuthenticated) {
            // 获取用户名，处理localStorage访问被阻止的情况
            let username = '用户';
            try {
                username = localStorage.getItem('username') || '用户';
            } catch (error) {
                console.warn('localStorage access blocked, using default username:', error);
                try {
                    username = window.sessionStorage && sessionStorage.getItem('username') || '用户';
                } catch (sessionError) {
                    console.warn('sessionStorage access also blocked:', sessionError);
                }
            }

            // 已登录状态，修改模态框内容为退出登录
            const modalContent = adminLoginModal.querySelector('div > div');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div style="background-color: white; padding: 30px; border-radius: 12px 12px 0 0;">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 style="color: #333; font-weight: 600; margin: 0;">用户中心</h2>
                            <button
                                type="button"
                                id="close-login-modal"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999; transition: color 0.3s ease;"
                                onmouseover="this.style.color = '#333'"
                                onmouseout="this.style.color = '#999'"
                            >&times;</button>
                        </div>
                        <div style="text-align: center; padding: 20px 0;">
                            <p style="font-size: 18px; color: #333; margin-bottom: 30px;">欢迎，${username}</p>
                            <button
                                type="button"
                                id="logout-btn"
                                style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: white; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;"
                                onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';"
                                onmouseout="this.style.transform = 'translateY(0)'; this.style.boxShadow = 'none';"
                            >退出登录</button>
                        </div>
                    </div>
                `;

                // 等待DOM更新后再绑定事件
                setTimeout(function () {
                    // 添加退出登录按钮事件
                    const logoutBtn = adminLoginModal.querySelector('#logout-btn');
                    if (logoutBtn) {
                        console.log('退出登录按钮找到，绑定点击事件');
                        // 移除之前可能存在的事件监听器
                        logoutBtn.removeEventListener('click', logout);
                        // 添加新的事件监听器
                        logoutBtn.addEventListener('click', function (e) {
                            e.preventDefault();
                            console.log('退出登录按钮被点击');
                            logout();
                        });
                    } else {
                        console.log('退出登录按钮未找到');
                        // 打印当前模态框的HTML结构
                        console.log('当前模态框内容:', adminLoginModal.innerHTML);
                    }
                }, 100);

                // 添加关闭按钮事件
                const closeBtn = adminLoginModal.querySelector('#close-login-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', closeLoginModalFunc);
                }
            }
        } else {
            // 未登录状态，恢复原有的登录/注册表单
            const modalContent = adminLoginModal.querySelector('div > div');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div style="background-color: white; padding: 30px; border-radius: 12px 12px 0 0;">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 style="color: #333; font-weight: 600; margin: 0;">用户登录</h2>
                            <button
                                type="button"
                                id="close-login-modal"
                                style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999; transition: color 0.3s ease;"
                                onmouseover="this.style.color = '#333'"
                                onmouseout="this.style.color = '#999'"
                            >&times;</button>
                        </div>

                        <!-- 标签页切换 -->
                        <div class="mb-4">
                            <ul
                                class="nav nav-tabs"
                                style="border-bottom: 1px solid #e0e0e0;"
                            >
                                <li class="nav-item">
                                    <a
                                        class="nav-link active"
                                        id="login-tab"
                                        data-toggle="tab"
                                        href="#login-content"
                                        style="color: #667eea; font-weight: 500; padding: 10px 20px; border-radius: 4px 4px 0 0; transition: all 0.3s ease;"
                                    >登录</a>
                                </li>
                                <li class="nav-item">
                                    <a
                                        class="nav-link"
                                        id="register-tab"
                                        data-toggle="tab"
                                        href="#register-content"
                                        style="color: #999; font-weight: 500; padding: 10px 20px; border-radius: 4px 4px 0 0; transition: all 0.3s ease;"
                                    >注册</a>
                                </li>
                            </ul>
                        </div>

                        <!-- 标签页内容 -->
                        <div class="tab-content">
                            <!-- 登录表单 -->
                            <div
                                class="tab-pane fade show active"
                                id="login-content"
                            >
                                <form id="login-form">
                                    <div class="form-group mb-4">
                                        <label
                                            for="username"
                                            style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;"
                                        >用户名</label>
                                        <input
                                            type="text"
                                            id="username"
                                            class="form-control"
                                            required
                                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: all 0.3s ease;"
                                            onfocus="this.style.borderColor = '#667eea'; this.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';"
                                            onblur="this.style.borderColor = '#e0e0e0'; this.style.boxShadow = 'none';"
                                        >
                                    </div>
                                    <div class="form-group mb-5">
                                        <label
                                            for="password"
                                            style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;"
                                        >密码</label>
                                        <input
                                            type="password"
                                            id="password"
                                            class="form-control"
                                            required
                                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: all 0.3s ease;"
                                            onfocus="this.style.borderColor = '#667eea'; this.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';"
                                            onblur="this.style.borderColor = '#e0e0e0'; this.style.boxShadow = 'none';"
                                        >
                                    </div>
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-block"
                                        style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: white; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;"
                                        onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';"
                                        onmouseout="this.style.transform = 'translateY(0)'; this.style.boxShadow = 'none';"
                                    >登录</button>
                                </form>
                            </div>

                            <!-- 注册表单 -->
                            <div
                                class="tab-pane fade"
                                id="register-content"
                            >
                                <form id="register-form">
                                    <div class="form-group mb-4">
                                        <label
                                            for="register-username"
                                            style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;"
                                        >用户名</label>
                                        <input
                                            type="text"
                                            id="register-username"
                                            class="form-control"
                                            required
                                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: all 0.3s ease;"
                                            onfocus="this.style.borderColor = '#667eea'; this.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';"
                                            onblur="this.style.borderColor = '#e0e0e0'; this.style.boxShadow = 'none';"
                                        >
                                    </div>
                                    <div class="form-group mb-4">
                                        <label
                                            for="register-password"
                                            style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;"
                                        >密码</label>
                                        <input
                                            type="password"
                                            id="register-password"
                                            class="form-control"
                                            required
                                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: all 0.3s ease;"
                                            onfocus="this.style.borderColor = '#667eea'; this.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';"
                                            onblur="this.style.borderColor = '#e0e0e0'; this.style.boxShadow = 'none';"
                                        >
                                    </div>
                                    <div class="form-group mb-5">
                                        <label
                                            for="register-confirm-password"
                                            style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;"
                                        >确认密码</label>
                                        <input
                                            type="password"
                                            id="register-confirm-password"
                                            class="form-control"
                                            required
                                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: all 0.3s ease;"
                                            onfocus="this.style.borderColor = '#667eea'; this.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.1)';"
                                            onblur="this.style.borderColor = '#e0e0e0'; this.style.boxShadow = 'none';"
                                        >
                                    </div>
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-block"
                                        style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: white; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;"
                                        onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';"
                                        onmouseout="this.style.transform = 'translateY(0)'; this.style.boxShadow = 'none';"
                                    >注册</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `;

                // 添加关闭按钮事件
                const closeBtn = adminLoginModal.querySelector('#close-login-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', closeLoginModalFunc);
                }

                // 重新获取输入元素引用
                usernameInput = adminLoginModal.querySelector('#username');
                passwordInput = adminLoginModal.querySelector('#password');
                registerUsernameInput = adminLoginModal.querySelector('#register-username');
                registerPasswordInput = adminLoginModal.querySelector('#register-password');
                registerConfirmPasswordInput = adminLoginModal.querySelector('#register-confirm-password');

                // 重新绑定表单事件
                const loginForm = adminLoginModal.querySelector('#login-form');
                if (loginForm) {
                    loginForm.addEventListener('submit', handleLogin);
                }

                const registerForm = adminLoginModal.querySelector('#register-form');
                if (registerForm) {
                    registerForm.addEventListener('submit', handleRegister);
                }

                console.log('重新获取输入元素引用:', {
                    usernameInput: !!usernameInput,
                    passwordInput: !!passwordInput,
                    registerUsernameInput: !!registerUsernameInput,
                    registerPasswordInput: !!registerPasswordInput,
                    registerConfirmPasswordInput: !!registerConfirmPasswordInput
                });
            }
        }

        adminLoginModal.style.display = 'flex';
    }
}

// 关闭登录模态框
function closeLoginModalFunc () {
    if (adminLoginModal) {
        adminLoginModal.style.display = 'none';
    }
}

// 加载首页产品数据
async function loadHomePageProducts () {
    console.log('Loading home page products...');
    if (!productList) return;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        const response = await fetch(`${API_BASE_URL_CLEAN}/api/products`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        products = await response.json();
        console.log('Home page products loaded successfully:', products);
        // 按照创建时间倒序排序，新添加的商品显示在最顶部
        products.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt).getTime();
            const dateB = new Date(b.created_at || b.createdAt).getTime();
            return dateB - dateA;
        });
        renderHomePageProducts();
    } catch (error) {
        console.error('Error loading home page products:', error);
        // 不使用备用数据，显示空状态
        products = [];
        renderHomePageProducts();
    }
}

// 渲染首页产品列表
function renderHomePageProducts () {
    if (!productList) return;

    if (products.length === 0) {
        productList.innerHTML = '<div class="empty-state">暂无商品数据</div>';
        return;
    }

    productList.innerHTML = products.map((product, index) => {
        let imgSrc = product.img;
        if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
            imgSrc = API_BASE_URL_CLEAN + imgSrc;
        }
        if (!imgSrc) {
            imgSrc = 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'><rect width=\'300\' height=\'300\' fill=\'#f0f0f0\'/><text x=\'150\' y=\'160\' text-anchor=\'middle\' fill=\'#999\' font-size=\'16\'>图片加载失败</text></svg>';
        }
        return `
        <div class="brand_item-box">
            <div class="brand_img-box item-${index + 1}" style="background-image: url(${imgSrc})">
                <a href="#" title="查看更多">查看更多</a>
            </div>
            <div class="brand_detail-box">
                <h5>¥<span>${parseFloat(product.price).toFixed(2)}</span></h5>
                <p>${product.name}</p>
            </div>
        </div>
        `;
    }).join('');
}

// 显示管理面板
function showAdminPanel () {
    console.log('Showing admin panel');

    // 隐藏首页内容，显示管理面板
    if (heroArea) heroArea.style.display = 'none';
    if (bg) bg.style.display = 'none';
    if (contactSection) contactSection.style.display = 'none';
    if (infoSection) infoSection.style.display = 'none';
    if (footerSection) footerSection.style.display = 'none';

    // 加载管理系统HTML
    if (adminPanel) {
        adminPanel.style.display = 'block';
        adminPanel.innerHTML = `
        <div id="app" style="width: 100%; height: 100vh; overflow: hidden; background-color: #f5f5f5;">
            <style>
                /* 全局样式 */
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                /* 禁止页面左右滑动 */
                body {
                    overflow-x: hidden;
                }
                
                /* 响应式布局 */
                @media (max-width: 768px) {
                    .header {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 15px;
                    }
                    
                    .header h1 {
                        font-size: 20px !important;
                        margin-bottom: 10px;
                    }
                    
                    .header-tabs {
                        width: 100%;
                        flex-wrap: wrap;
                    }
                    
                    .header-tabs button {
                        flex: 1;
                        min-width: 80px;
                        padding: 6px 12px !important;
                        font-size: 14px;
                    }
                    
                    .main {
                        padding: 15px !important;
                    }
                    
                    .search-filter {
                        flex-direction: column;
                    }
                    
                    .search-filter input,
                    .search-filter select {
                        width: 100% !important;
                    }
                    
                    .product-table,
                    .order-table,
                    .analytics-table {
                        font-size: 12px;
                    }
                    
                    .product-table th,
                    .order-table th,
                    .analytics-table th {
                        padding: 8px !important;
                    }
                    
                    .product-table td,
                    .order-table td,
                    .analytics-table td {
                        padding: 8px !important;
                    }
                    
                    .analytics-overview {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .charts-section {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .chart-container {
                        height: 250px !important;
                    }
                }
            </style>
            <header class="header" style="background-color: #b5caee; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: white;">商品管理系统</h1>
                <div class="header-tabs" style="display: flex; gap: 10px;">
                    <button class="tab-btn active" data-tab="products" style="background: rgba(0, 0, 0, 0.3); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease;">商品管理</button>
                    <button class="tab-btn" data-tab="orders" style="background: rgba(0, 0, 0, 0.1); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease;">订单管理</button>
                    <button class="tab-btn" data-tab="analytics" style="background: rgba(0, 0, 0, 0.1); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease;">数据分析</button>
                    <button class="tab-btn" onclick="logout()" style="background: rgba(0, 0, 0, 0.1); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all 0.3s ease;">退出登录</button>
                </div>
            </header>

            <main class="main" style="padding: 20px; width: 100%; height: calc(100vh - 120px); overflow-y: auto;">
                <!-- 商品管理页面 -->
                <div id="products-page" class="page-content" style="display: block; width: 100%;">
                    <!-- 搜索和过滤 -->
                    <div class="search-filter" style="margin-bottom: 20px; display: flex; gap: 10px; width: 100%; align-items: center;">
                        <button class="btn btn-primary" id="add-product-btn" style="padding: 8px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 4px; color: white; cursor: pointer; transition: all 0.3s ease;">添加商品</button>
                        <input type="text" id="search-input" placeholder="搜索商品名称" class="search-input" style="padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px; flex: 1; width: 100%;">
                    </div>

                    <!-- 商品列表 -->
                    <div class="product-list" style="width: 100%;">
                        <div id="products-loading" class="loading-state" style="display: none; text-align: center; padding: 20px; color: #333;">加载中...</div>
                        <div style="overflow-x: auto; width: 100%;">
                            <table class="product-table" style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                <thead style="background-color: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">ID</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">图片</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">名称</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">描述</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">价格</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">库存</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">创建时间</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="product-list-body">
                                    <!-- 商品列表将通过JavaScript动态生成 -->
                                </tbody>
                            </table>
                        </div>
                        <div id="products-empty-state" class="empty-state" style="display: none; text-align: center; padding: 40px; background-color: white; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); color: #333;">暂无商品数据</div>
                    </div>
                </div>

                <!-- 订单管理页面 -->
                <div id="orders-page" class="page-content" style="display: none; width: 100%;">
                    <!-- 搜索和过滤 -->
                    <div class="search-filter" style="margin-bottom: 20px; display: flex; gap: 10px; width: 100%; flex-wrap: wrap;">
                        <input type="text" id="order-search-input" placeholder="搜索订单" class="search-input" style="padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px; flex: 1; min-width: 200px;">
                        <select id="order-status-filter" class="status-filter" style="padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px; min-width: 150px;">
                            <option value="">全部状态</option>
                            <option value="0">待发货</option>
                            <option value="1">待收货</option>
                            <option value="2">进行中</option>
                            <option value="3">已完成</option>
                        </select>
                        <button id="batch-delete-btn" class="btn btn-danger" style="padding: 8px 16px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;" onclick="batchDeleteOrders()">
                            <i class="fas fa-trash"></i>
                            批量删除
                        </button>
                    </div>

                    <!-- 订单列表 -->
                    <div class="order-list" style="width: 100%;">
                        <div id="orders-loading" class="loading-state" style="display: none; text-align: center; padding: 20px; color: #333;">加载中...</div>
                        <div style="overflow-x: auto; width: 100%;">
                            <table class="order-table" style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                <thead style="background-color: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333; width: 50px;">
                                            <input type="checkbox" id="select-all-orders" onchange="toggleSelectAllOrders()" style="cursor: pointer;">
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">订单</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">联系人</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">商品数量</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">总金额</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">状态</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">收货地址</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">创建时间</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="order-list-body">
                                    <!-- 订单列表将通过JavaScript动态生成 -->
                                </tbody>
                            </table>
                        </div>
                        <div id="orders-empty-state" class="empty-state" style="display: none; text-align: center; padding: 40px; background-color: white; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); color: #333;">暂无订单数据</div>
                    </div>
                </div>

                <!-- 数据分析页面 -->
                <div id="analytics-page" class="page-content" style="display: none; width: 100%;">
                    <!-- 数据分析页面内容 -->
                    <h2 style="margin-bottom: 20px; color: #333;">数据分析</h2>

                    <div id="analytics-loading" class="loading-state" style="display: none; text-align: center; padding: 20px; color: #333;">加载中...</div>

                    <!-- 数据概览卡片 -->
                    <div class="analytics-overview" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; width: 100%;">
                        <div class="stat-card" style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #666; font-size: 16px;">总商品数</h3>
                            <div class="stat-value" id="total-products" style="font-size: 24px; font-weight: 600; color: #667eea;">0</div>
                        </div>
                        <div class="stat-card" style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #666; font-size: 16px;">总订单数</h3>
                            <div class="stat-value" id="total-orders" style="font-size: 24px; font-weight: 600; color: #667eea;">0</div>
                        </div>
                        <div class="stat-card" style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #666; font-size: 16px;">总销售额</h3>
                            <div class="stat-value" id="total-sales" style="font-size: 24px; font-weight: 600; color: #667eea;">¥0.00</div>
                        </div>
                        <div class="stat-card" style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #666; font-size: 16px;">平均订单金额</h3>
                            <div class="stat-value" id="avg-order-amount" style="font-size: 24px; font-weight: 600; color: #667eea;">¥0.00</div>
                        </div>
                    </div>

                    <!-- 图表区域 -->
                    <div class="charts-section" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px; width: 100%;">
                        <!-- 订单流量分析图表 -->
                        <div class="chart-container" style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); height: 300px; width: 100%;">
                            <h3 style="margin: 0 0 20px 0; color: #333;">订单流量分析</h3>
                            <canvas id="order-flow-chart" width="400" height="200"></canvas>
                        </div>

                        <!-- 商品销售分析图表 -->
                        <div class="chart-container" style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); height: 300px; width: 100%;">
                            <h3 style="margin: 0 0 20px 0; color: #333;">商品销售分析</h3>
                            <canvas id="product-sales-chart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <!-- 销售数据表格 -->
                    <div class="analytics-table-section" style="margin-top: 30px; width: 100%;">
                        <h3 style="margin: 0 0 20px 0; color: #333;">销售数据明细</h3>
                        <div class="analytics-table-container" style="overflow-x: auto; width: 100%;">
                            <table class="analytics-table" style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                <thead style="background-color: #f8f9fa;">
                                    <tr>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">商品名称</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">销售数量</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">销售金额</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; color: #333;">占比</th>
                                    </tr>
                                </thead>
                                <tbody id="sales-data-body" style="max-height: 400px; overflow-y: auto;">
                                    <!-- 销售数据将通过JavaScript动态生成 -->
                                </tbody>
                            </table>
                        </div>
                        <div class="pagination" id="sales-pagination" style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; width: 100%;">
                            <button class="pagination-btn" id="prev-page-btn" disabled style="padding: 6px 12px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; color: #333;">上一页</button>
                            <span class="pagination-info" id="pagination-info" style="color: #333;">第 1 页 / 共 1 页</span>
                            <button class="pagination-btn" id="next-page-btn" disabled style="padding: 6px 12px; background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px; cursor: pointer; color: #333;">下一页</button>
                        </div>
                    </div>
                </div>
            </main>

            <!-- 添加 / 编辑商品表单 -->
            <div id="modal-overlay" class="modal-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); justify-content: center; align-items: center; z-index: 1000;">
                <div class="modal" style="background-color: white; padding: 30px; border-radius: 8px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 id="modal-title" style="margin: 0; color: #333;">添加商品</h2>
                        <button class="close-btn" id="close-modal-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="product-form">
                            <input type="hidden" id="product-id">
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-name" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">商品名称</label>
                                <input type="text" id="product-name" required class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-description" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">商品描述</label>
                                <textarea id="product-description" rows="3" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px;"></textarea>
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-price" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">商品价格</label>
                                <input type="number" id="product-price" step="0.01" min="0" required class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-original-price" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">划线价格（原价）</label>
                                <input type="number" id="product-original-price" step="0.01" min="0" class="form-input" placeholder="用于显示折扣信息，留空则不显示" style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-category" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">商品分类</label>
                                <select id="product-category" class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px;">
                                    <option value="">加载中...</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-stock" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">库存数量</label>
                                <input type="number" id="product-stock" min="0" required class="form-input" style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <label for="product-img" style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">商品图片</label>
                                <input type="text" id="product-img" placeholder="图片预览（自动生成）" class="form-input" readonly style="width: 100%; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 10px;">
                                <input type="file" id="product-img-file" accept="image/*" style="margin-top: 10px;">
                                <small style="color: #666; display: block; margin-top: 5px;">支持JPG、PNG等格式图片上传</small>
                            </div>
                            <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                                <button type="button" class="btn btn-secondary" id="cancel-btn" style="padding: 8px 16px; background: #6c757d; border: none; border-radius: 4px; color: white; cursor: pointer;">取消</button>
                                <button type="submit" class="btn btn-primary" id="submit-btn" style="padding: 8px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 4px; color: white; cursor: pointer;">添加</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 错误提示 -->
            <div id="error-message" class="error-message" style="display: none; position: fixed; top: 20px; right: 20px; padding: 15px; border-radius: 4px; color: white; z-index: 1000; display: flex; align-items: center; min-width: 300px;">
                <span id="error-text"></span>
            </div>
        </div>
        `;

        // 重新获取DOM元素并绑定事件
        getDOMElements();
        bindEvents();
    }
}

// 隐藏管理面板
function hideAdminPanel () {
    console.log('Hiding admin panel');

    // 显示首页内容，隐藏管理面板
    const heroArea = document.querySelector('.hero_area');
    if (heroArea) {
        heroArea.style.display = 'block';
    }

    const bg = document.querySelector('.bg');
    if (bg) {
        bg.style.display = 'block';
    }

    const contactSection = document.querySelector('.contact_section');
    if (contactSection) {
        contactSection.style.display = 'block';
    }

    const infoSection = document.querySelector('.info_section');
    if (infoSection) {
        infoSection.style.display = 'block';
    }

    const footerSection = document.querySelector('.footer_section');
    if (footerSection) {
        footerSection.style.display = 'block';
    }

    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
}

// 网站浏览量统计
async function updateVisitCount () {
    try {
        const response = await fetch(`${API_BASE_URL_CLEAN}/api/visit-count/increment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const countElement = document.getElementById('count-number');
            if (countElement) {
                countElement.textContent = data.count.toLocaleString();
            }
        } else {
            throw new Error('API请求失败');
        }
    } catch (error) {
        console.warn('后端API访问失败:', error);
    }
}

// 显示当前浏览量
async function displayVisitCount () {
    try {
        const response = await fetch(`${API_BASE_URL_CLEAN}/api/visit-count`);

        if (response.ok) {
            const data = await response.json();
            const countElement = document.getElementById('count-number');
            if (countElement) {
                countElement.textContent = data.count.toLocaleString();
            }
        } else {
            throw new Error('API请求失败');
        }
    } catch (error) {
        console.warn('后端API访问失败:', error);
    }
}

// 在DOM加载完成后初始化浏览量统计
document.addEventListener('DOMContentLoaded', async () => {
    await displayVisitCount();
    await updateVisitCount();
});

