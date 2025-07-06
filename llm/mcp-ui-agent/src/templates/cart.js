// src/templates/cart.js - Template for displaying shopping cart contents

export function cartTemplate(data, styleRules) {
    // Extract cart information from the data
    const { items, totalAmount, itemCount } = data;

    // Helper function to format prices
    const formatPrice = (price) => `$${price.toFixed(2)}`;

    // Calculate if we should show free shipping (example business rule)
    const freeShippingThreshold = 50;
    const remainingForFreeShipping = Math.max(0, freeShippingThreshold - totalAmount);

    // Build the shopping cart HTML
    return `
    <!-- Cart header with item count -->
    <div class="header">
      <h1>Shopping Cart</h1>
      <p class="text-muted">${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart</p>
    </div>
    
    <!-- Free shipping progress bar -->
    ${totalAmount < freeShippingThreshold ? `
      <div class="shipping-notice card mb-2" style="background: #fef3c7; border: 1px solid #fcd34d;">
        <p style="color: #92400e; margin-bottom: 8px;">
          Add ${formatPrice(remainingForFreeShipping)} more for FREE shipping!
        </p>
        <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
          <div style="background: var(--primary-color); height: 100%; width: ${(totalAmount / freeShippingThreshold) * 100}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    ` : `
      <div class="shipping-notice card mb-2" style="background: #d1fae5; border: 1px solid #6ee7b7;">
        <p style="color: #065f46;">
          ✓ You qualify for FREE shipping!
        </p>
      </div>
    `}
    
    <!-- Cart items list -->
    ${items.length > 0 ? `
      <div class="cart-items">
        ${items.map((item, index) => `
          <div class="cart-item card mb-1" style="display: grid; grid-template-columns: 120px 1fr auto; gap: 16px; align-items: center;">
            
            <!-- Product image -->
            <img src="${item.product.image}" alt="${item.product.name}" 
                 style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
            
            <!-- Product details -->
            <div class="item-details">
              <h3 style="font-size: 18px; margin-bottom: 4px;">${item.product.name}</h3>
              <p class="text-muted" style="font-size: 14px;">
                ${item.product.brand} ${item.product.color ? `• ${item.product.color}` : ''}
              </p>
              <p style="color: var(--primary-color); font-weight: 500; margin-top: 8px;">
                ${formatPrice(item.product.price)} each
              </p>
            </div>
            
            <!-- Quantity and subtotal -->
            <div class="item-controls" style="text-align: right;">
              <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end; margin-bottom: 8px;">
                <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0;"
                        data-action="update-quantity"
                        data-data='{"productId": "${item.productId}", "change": -1}'>
                  −
                </button>
                <span style="font-weight: 500; min-width: 40px; text-align: center;">
                  ${item.quantity}
                </span>
                <button class="btn btn-secondary" style="width: 32px; height: 32px; padding: 0;"
                        data-action="update-quantity"
                        data-data='{"productId": "${item.productId}", "change": 1}'>
                  +
                </button>
              </div>
              
              <div style="font-size: 20px; font-weight: bold;">
                ${formatPrice(item.product.price * item.quantity)}
              </div>
              
              <button class="btn btn-secondary" style="font-size: 12px; margin-top: 8px;"
                      data-action="remove-from-cart"
                      data-data='{"productId": "${item.productId}"}'>
                Remove
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Order summary -->
      <div class="order-summary card mt-2" style="background: #f9fafb;">
        <h3 style="font-size: 20px; margin-bottom: 16px;">Order Summary</h3>
        
        <div style="display: grid; gap: 8px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal (${itemCount} item${itemCount !== 1 ? 's' : ''}):</span>
            <span>${formatPrice(totalAmount)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <span>Shipping:</span>
            <span>${totalAmount >= freeShippingThreshold ? 'FREE' : formatPrice(5.99)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <span>Tax (estimated):</span>
            <span>${formatPrice(totalAmount * 0.08)}</span>
          </div>
          
          <div style="border-top: 2px solid var(--primary-color); padding-top: 8px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
              <span>Total:</span>
              <span style="color: var(--primary-color);">
                ${formatPrice(totalAmount + (totalAmount >= freeShippingThreshold ? 0 : 5.99) + (totalAmount * 0.08))}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Checkout button -->
        <button class="btn" style="width: 100%; font-size: 18px; padding: 12px;"
                data-action="checkout">
          Proceed to Checkout
        </button>
        
        <!-- Continue shopping link -->
        <button class="btn btn-secondary" style="width: 100%; margin-top: 8px;"
                onclick="history.back()">
          Continue Shopping
        </button>
      </div>
    ` : `
      <!-- Empty cart state -->
      <div class="empty-cart text-center" style="padding: 60px 20px;">
        <div style="font-size: 64px; margin-bottom: 16px;">🛒</div>
        <h2 style="color: var(--text-color); opacity: 0.6;">Your cart is empty</h2>
        <p class="text-muted mt-1">Add some products to get started!</p>
        <button class="btn mt-2" onclick="history.back()">
          Start Shopping
        </button>
      </div>
    `}
    
    <!-- Suggested products could go here in a real implementation -->
    <div class="suggestions mt-2">
      <!-- "You might also like" section would appear here -->
    </div>
  `;
}
