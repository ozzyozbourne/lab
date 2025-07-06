// src/templates/checkout.js - Template for order confirmation after checkout

export function checkoutTemplate(data, styleRules) {
    // Extract order confirmation data
    const { orderId, message, estimatedDelivery } = data;

    // Format the delivery date to be more human-readable
    const formatDeliveryDate = (dateString) => {
        const date = new Date(dateString);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    // Generate a random celebration animation for fun
    const celebrationEmojis = ['🎉', '🎊', '✨', '🎁', '📦'];
    const randomEmoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];

    // Build the order confirmation HTML
    return `
    <!-- Success animation container -->
    <div class="confirmation-header text-center" style="padding: 40px 20px;">
      <!-- Animated checkmark -->
      <div class="success-icon" style="
        width: 100px;
        height: 100px;
        margin: 0 auto 20px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 50px;
        color: white;
        animation: scaleIn 0.5s ease;
      ">
        ✓
      </div>
      
      <h1 style="font-size: 36px; color: #10b981; margin-bottom: 16px;">
        Order Confirmed! ${randomEmoji}
      </h1>
      
      <p style="font-size: 20px; color: var(--text-color); opacity: 0.8;">
        ${message || 'Thank you for your purchase!'}
      </p>
    </div>
    
    <!-- Order details card -->
    <div class="order-details card" style="max-width: 600px; margin: 0 auto;">
      <div class="order-info" style="text-align: center; padding: 24px; background: #f3f4f6; border-radius: 8px;">
        <h2 style="font-size: 24px; margin-bottom: 16px;">Order Details</h2>
        
        <div style="display: grid; gap: 12px;">
          <div>
            <p class="text-muted" style="font-size: 14px; margin-bottom: 4px;">Order Number</p>
            <p style="font-size: 20px; font-weight: bold; font-family: monospace;">
              ${orderId}
            </p>
          </div>
          
          <div>
            <p class="text-muted" style="font-size: 14px; margin-bottom: 4px;">Estimated Delivery</p>
            <p style="font-size: 18px; font-weight: 500; color: var(--primary-color);">
              ${formatDeliveryDate(estimatedDelivery)}
            </p>
          </div>
        </div>
      </div>
      
      <!-- What happens next section -->
      <div class="next-steps mt-2">
        <h3 style="font-size: 20px; margin-bottom: 16px;">What Happens Next?</h3>
        
        <div class="timeline" style="position: relative; padding-left: 30px;">
          ${[
            { step: 'Order Confirmation', desc: 'You\'ll receive an email confirmation shortly', done: true },
            { step: 'Processing', desc: 'We\'re preparing your items for shipment', done: false },
            { step: 'Shipping', desc: 'Your order will be on its way', done: false },
            { step: 'Delivery', desc: `Expected by ${formatDeliveryDate(estimatedDelivery)}`, done: false }
        ].map((item, index) => `
            <div class="timeline-item" style="position: relative; margin-bottom: 24px;">
              <!-- Timeline dot -->
              <div style="
                position: absolute;
                left: -30px;
                top: 0;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: ${item.done ? 'var(--primary-color)' : '#e5e7eb'};
                border: 2px solid ${item.done ? 'var(--primary-color)' : '#e5e7eb'};
              "></div>
              
              <!-- Timeline line -->
              ${index < 3 ? `
                <div style="
                  position: absolute;
                  left: -22px;
                  top: 16px;
                  width: 2px;
                  height: 40px;
                  background: #e5e7eb;
                "></div>
              ` : ''}
              
              <!-- Step content -->
              <div>
                <h4 style="font-size: 16px; margin-bottom: 4px; ${item.done ? 'color: var(--primary-color);' : ''}">
                  ${item.step} ${item.done ? '✓' : ''}
                </h4>
                <p class="text-muted" style="font-size: 14px;">${item.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="confirmation-actions" style="display: grid; gap: 12px; margin-top: 32px;">
        <button class="btn" data-action="track-order" data-data='{"orderId": "${orderId}"}'>
          Track Your Order
        </button>
        
        <button class="btn btn-secondary" data-action="view-orders">
          View All Orders
        </button>
        
        <button class="btn btn-secondary" onclick="window.location.href='/'">
          Continue Shopping
        </button>
      </div>
    </div>
    
    <!-- Helpful information -->
    <div class="help-section card mt-2" style="max-width: 600px; margin: 20px auto; background: #fef3c7;">
      <h3 style="font-size: 18px; margin-bottom: 8px;">Need Help?</h3>
      <p style="font-size: 14px; color: #92400e;">
        If you have any questions about your order, please reference your order number 
        <strong>${orderId}</strong> when contacting customer support.
      </p>
    </div>
    
    <!-- Add the animation keyframes -->
    <style>
      @keyframes scaleIn {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Add a subtle celebration animation */
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .success-icon {
        animation: scaleIn 0.5s ease, float 2s ease-in-out infinite;
        animation-delay: 0s, 0.5s;
      }
    </style>
  `;
}
