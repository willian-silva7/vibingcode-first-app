const products = [
  {
    id: 'apple',
    name: 'Apple',
    emoji: '🍎',
    price: 1.25,
    unit: 'per lb',
    description: 'Crisp, sweet, and perfect for snacking.'
  },
  {
    id: 'banana',
    name: 'Banana',
    emoji: '🍌',
    price: 0.75,
    unit: 'per bunch',
    description: 'Naturally sweet and convenient for everyday energy.'
  },
  {
    id: 'orange',
    name: 'Orange',
    emoji: '🍊',
    price: 1.1,
    unit: 'per item',
    description: 'Juicy and bright with a refreshing citrus flavor.'
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    price: 2.5,
    unit: 'per box',
    description: 'Sweet red berries ideal for desserts and smoothies.'
  },
  {
    id: 'mango',
    name: 'Mango',
    emoji: '🥭',
    price: 1.8,
    unit: 'per item',
    description: 'A tropical favorite with bright, juicy flesh.'
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    emoji: '🍍',
    price: 3.25,
    unit: 'per item',
    description: 'Tangy, sweet, and perfect for summer fruit bowls.'
  },
  {
    id: 'grape',
    name: 'Grape',
    emoji: '🍇',
    price: 2.1,
    unit: 'per bunch',
    description: 'Small, juicy clusters bursting with flavor.'
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    emoji: '🍉',
    price: 4.5,
    unit: 'per item',
    description: 'Hydrating and refreshing with a naturally sweet taste.'
  },
  {
    id: 'pear',
    name: 'Pear',
    emoji: '🍐',
    price: 1.45,
    unit: 'per item',
    description: 'Smooth, crisp, and pleasantly sweet in every bite.'
  },
  {
    id: 'peach',
    name: 'Peach',
    emoji: '🍑',
    price: 1.7,
    unit: 'per item',
    description: 'Soft, fragrant, and ideal for fruit salads.'
  }
];

const state = {
  page: 'products',
  selectedProductId: products[0].id,
  cart: [],
  orderConfirmation: ''
};

const pageRoot = document.getElementById('page-root');
const toastContainer = document.getElementById('toast-container');
const navButtons = [...document.querySelectorAll('.nav-button')];
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

function showToast(message, type = 'success') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  window.setTimeout(() => {
    toast.classList.remove('visible');
    window.setTimeout(() => toast.remove(), 220);
  }, 2600);
}

function getProductById(id) {
  return products.find((product) => product.id === id);
}

function getCartItemCount() {
  return state.cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartTotal() {
  return state.cart.reduce((total, item) => total + item.quantity * item.price, 0);
}

function renderNav() {
  const compact = window.innerWidth < 600;
  const config = {
    products: { label: 'Products', short: 'P', icon: '🛒' },
    details: { label: 'Product Details', short: 'PD', icon: '📄' },
    cart: { label: 'Shopping Cart', short: 'SC', icon: '🛍️' },
    checkout: { label: 'Checkout', short: 'Ch', icon: '💳' }
  };

  navButtons.forEach((button) => {
    const page = button.dataset.page;
    const entry = config[page];
    const displayLabel = compact ? entry.short : entry.label;
    const cartCount = page === 'cart' ? getCartItemCount() : 0;
    const badgeMarkup = page === 'cart' && cartCount > 0 ? `<span class="nav-badge" aria-label="${cartCount} items in cart">${cartCount}</span>` : '';
    const content = `
      <span class="nav-button-content">
        <span class="nav-icon" aria-hidden="true">${entry.icon}</span>
        <span class="nav-label">${displayLabel}</span>
      </span>
      ${badgeMarkup}
    `;

    button.innerHTML = content;
    button.classList.toggle('active', button.dataset.page === state.page);
    button.classList.toggle('compact', compact);
    button.setAttribute('aria-label', entry.label);
  });
}

function addToCart(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product) return;

  const parsedQuantity = Number(quantity) || 1;
  const existingItem = state.cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += parsedQuantity;
  } else {
    state.cart.push({
      id: productId,
      name: product.name,
      emoji: product.emoji,
      price: product.price,
      quantity: parsedQuantity
    });
  }

  state.orderConfirmation = '';
  state.page = 'cart';
  showToast(`${product.name} added to cart.`, 'info');
  render();
}

function changeCartQuantity(productId, delta) {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter((entry) => entry.id !== productId);
  }

  render();
}

function removeCartItem(productId) {
  const item = state.cart.find((entry) => entry.id === productId);
  state.cart = state.cart.filter((entry) => entry.id !== productId);
  if (item) {
    showToast(`${item.name} removed from cart.`, 'info');
  }
  render();
}

function handleProcessOrder() {
  const total = getCartTotal();
  state.cart = [];
  state.page = 'products';
  state.orderConfirmation = `Thank you! Your order for ${formatCurrency(total)} has been placed successfully.`;
  showToast('Thank you! Your order has been placed successfully.', 'success');
  render();
}

function renderProductsPage() {
  const confirmationBanner = state.orderConfirmation
    ? `<div class="order-success-banner">${state.orderConfirmation}</div>`
    : '';

  pageRoot.innerHTML = `
    <section class="page">
      <header class="page-header">
        <h1>Products</h1>
      </header>

      ${confirmationBanner}

      <div class="product-grid">
        ${products
          .map(
            (product) => `
              <article class="product-card">
                <div class="product-emoji" aria-label="${product.name}">${product.emoji}</div>
                <h2 class="product-name">${product.name}</h2>
                <div class="product-price">${formatCurrency(product.price)} ${product.unit}</div>
                <div class="product-meta">
                  <span>Qty:</span>
                  <select class="quantity-select" data-quantity-select="${product.id}" aria-label="Select quantity for ${product.name}">
                    ${[1, 2, 3, 4, 5]
                      .map((qty) => `<option value="${qty}" ${qty === 1 ? 'selected' : ''}>${qty}</option>`)
                      .join('')}
                  </select>
                </div>
                <div class="product-actions">
                  <button class="secondary-button" type="button" data-detail-id="${product.id}" title="View details for ${product.name}">View Details</button>
                  <button class="primary-button" type="button" data-add-id="${product.id}" title="Add ${product.name} to cart">Add to Cart</button>
                </div>
              </article>
            `
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderDetailsPage() {
  const product = getProductById(state.selectedProductId) || products[0];

  pageRoot.innerHTML = `
    <section class="page">
      <header class="page-header">
        <h1>Product Details</h1>
      </header>

      <article class="detail-card">
        <div class="detail-image" aria-label="${product.name} image">${product.emoji}</div>

        <div class="detail-content">
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <div class="detail-price">Price: ${formatCurrency(product.price)} ${product.unit}</div>

          <div class="detail-actions">
            <label>
              <span>Qty:</span>
              <select class="quantity-select" data-quantity-select="${product.id}" aria-label="Select quantity for ${product.name}">
                ${[1, 2, 3, 4, 5]
                  .map((qty) => `<option value="${qty}" ${qty === 1 ? 'selected' : ''}>${qty}</option>`)
                  .join('')}
              </select>
            </label>
            <button class="primary-button" type="button" data-add-id="${product.id}" title="Add ${product.name} to cart">Add to Cart</button>
          </div>

          <button class="ghost-button" type="button" data-page="products" title="Return to the products list">Back to Products</button>
        </div>
      </article>
    </section>
  `;
}

function renderCartPage() {
  const total = getCartTotal();

  if (state.cart.length === 0) {
    pageRoot.innerHTML = `
      <section class="page">
        <header class="page-header">
          <h1>Shopping Cart</h1>
        </header>
        <div class="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add fresh fruit from the products page to begin your order.</p>
          <button class="primary-button" type="button" data-page="products" title="Return to the products list">Continue Shopping</button>
        </div>
      </section>
    `;
    return;
  }

  pageRoot.innerHTML = `
    <section class="page">
      <header class="page-header">
        <h1>Shopping Cart</h1>
      </header>

      <div class="cart-list">
        ${state.cart
          .map(
            (item) => `
              <div class="cart-card">
                <div class="cart-item-emoji" aria-label="${item.name}">${item.emoji}</div>

                <div class="cart-item-details">
                  <h3>${item.name}</h3>
                  <div class="cart-item-price">${formatCurrency(item.price)} each</div>
                </div>

                <div class="cart-item-controls">
                  <div class="qty-stepper" aria-label="Quantity controls for ${item.name}">
                    <button type="button" data-adjust-quantity="${item.id}" data-delta="-1" title="Decrease quantity of ${item.name}">-</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-adjust-quantity="${item.id}" data-delta="1" title="Increase quantity of ${item.name}">+</button>
                  </div>
                  <button class="danger-button" type="button" data-remove-id="${item.id}" title="Remove ${item.name} from cart">Remove</button>
                </div>
              </div>
            `
          )
          .join('')}
      </div>

      <div class="cart-summary">
        <span>Subtotal</span>
        <strong>${formatCurrency(total)}</strong>
      </div>

      <div class="checkout-actions">
        <button class="primary-button" type="button" data-page="checkout" title="Continue to checkout">Continue to Checkout</button>
      </div>
    </section>
  `;
}

function renderCheckoutPage() {
  const total = getCartTotal();

  if (state.cart.length === 0) {
    pageRoot.innerHTML = `
      <section class="page">
        <header class="page-header">
          <h1>Checkout</h1>
        </header>
        <div class="empty-state">
          <h2>No order to process</h2>
          <p>Your cart is empty. Add products before checking out.</p>
          <button class="primary-button" type="button" data-page="products" title="Return to the products list">Go to Products</button>
        </div>
      </section>
    `;
    return;
  }

  pageRoot.innerHTML = `
    <section class="page">
      <header class="page-header">
        <h1>Checkout</h1>
      </header>

      <div class="checkout-card">
        <h2>Order Summary</h2>

        <div class="checkout-list">
          ${state.cart
            .map(
              (item) => `
                <div class="checkout-item">
                  <span>${item.name} x ${item.quantity}</span>
                  <span>${formatCurrency(item.quantity * item.price)}</span>
                </div>
              `
            )
            .join('')}
        </div>

        <div class="checkout-total">
          <span>Total</span>
          <span>${formatCurrency(total)}</span>
        </div>

        <div class="checkout-actions">
          <button class="primary-button" type="button" data-process-order="true" title="Place your order and complete checkout">Process Order</button>
        </div>
      </div>
    </section>
  `;
}

function renderPage() {
  if (state.page === 'products') {
    renderProductsPage();
  } else if (state.page === 'details') {
    renderDetailsPage();
  } else if (state.page === 'cart') {
    renderCartPage();
  } else {
    renderCheckoutPage();
  }

  renderNav();
}

document.addEventListener('click', (event) => {
  const pageTarget = event.target.closest('[data-page]');
  if (pageTarget) {
    state.page = pageTarget.dataset.page;
    renderPage();
    return;
  }

  const detailTarget = event.target.closest('[data-detail-id]');
  if (detailTarget) {
    state.selectedProductId = detailTarget.dataset.detailId;
    state.page = 'details';
    renderPage();
    return;
  }

  const addTarget = event.target.closest('[data-add-id]');
  if (addTarget) {
    const productId = addTarget.dataset.addId;
    const select = document.querySelector(`[data-quantity-select="${productId}"]`);
    const quantity = Number(select?.value || 1);
    addToCart(productId, quantity);
    return;
  }

  const adjustTarget = event.target.closest('[data-adjust-quantity]');
  if (adjustTarget) {
    const productId = adjustTarget.dataset.adjustQuantity;
    const delta = Number(adjustTarget.dataset.delta || 0);
    changeCartQuantity(productId, delta);
    return;
  }

  const removeTarget = event.target.closest('[data-remove-id]');
  if (removeTarget) {
    removeCartItem(removeTarget.dataset.removeId);
    return;
  }

  const processOrderTarget = event.target.closest('[data-process-order]');
  if (processOrderTarget) {
    handleProcessOrder();
  }
});

window.addEventListener('resize', renderNav);
renderPage();
