// src/templates/product-detail.js - Template for displaying detailed product information

export function productDetailTemplate(data, styleRules) {
    // Extract all the product information from the data
    const { id, name, brand, price, color, rating, description, image, inStock, specifications, reviews } = data;

    // Helper function to format price consistently across all templates
    const formatPrice = (price) => `$${price.toFixed(2)}`;

    // Helper function to generate star rating display
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '★';
            } else if (i === fullStars && hasHalfStar) {
                stars += '☆';
            } else {
                stars += '☆';
            }
        }

        return stars;
    };

    // Build the detailed product view HTML
    return `
    <!-- Navigation header to go back to product list -->
    <div class="header flex justify-between align-center">
      <h1>Product Details</h1>
      <button class="btn btn-secondary" onclick="history.back()">
        ← Back to Products
      </button>
    </div>
    
    <!-- Main product detail layout - image on left, info on right -->
    <div class="product-detail-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--spacing-unit) * 2); margin-top: calc(var(--spacing-unit) * 2);">
      
      <!-- Product image section -->
      <div class="product-image-section">
        <img src="${image}" alt="${name}" 
             style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Image gallery would go here in a real implementation -->
        <div class="image-thumbnails mt-2" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
          <!-- Placeholder for multiple product images -->
        </div>
      </div>
      
      <!-- Product information section -->
      <div class="product-info-section">
        <h2 style="font-size: 32px; margin-bottom: 8px;">${name}</h2>
        
        <div class="product-meta mb-2">
          <span class="brand" style="font-size: 18px; color: var(--text-color); opacity: 0.7;">
            by ${brand}
          </span>
          ${color ? `<span style="margin-left: 16px;">Color: <strong>${color}</strong></span>` : ''}
        </div>
        
        <div class="rating-section mb-2" style="display: flex; align-items: center;">
          <span style="color: #f59e0b; font-size: 20px;">${renderStars(rating)}</span>
          <span style="margin-left: 8px; font-size: 18px;">${rating}</span>
          <span style="margin-left: 8px; color: var(--text-color); opacity: 0.6;">
            (${reviews ? reviews.length : 0} reviews)
          </span>
        </div>
        
        <div class="price-section mb-2" style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
          <div style="font-size: 36px; font-weight: bold; color: var(--primary-color);">
            ${formatPrice(price)}
          </div>
          <div style="color: #059669; font-size: 14px; margin-top: 4px;">
            ${inStock ? '✓ In Stock' : '✗ Out of Stock'}
          </div>
        </div>
        
        <p class="description mb-2" style="font-size: 16px; line-height: 1.6; color: var(--text-color);">
          ${description}
        </p>
        
        <!-- Add to cart section -->
        <div class="purchase-section card" style="margin-top: calc(var(--spacing-unit) * 2);">
          <div style="display: flex; align-items: center; gap: 16px;">
            <label for="quantity" style="font-weight: 500;">Quantity:</label>
            <select id="quantity" class="btn btn-secondary" style="width: 80px;">
              ${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
            
            <button class="btn" style="flex: 1;"
                    data-action="add-to-cart" 
                    data-data='{"productId": "${id}", "quantity": 1}'
                    ${!inStock ? 'disabled' : ''}
                    onclick="this.dataset.data = JSON.stringify({productId: '${id}', quantity: parseInt(document.getElementById('quantity').value)})">
              ${inStock ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
        
        <!-- Specifications section if available -->
        ${specifications ? `
          <div class="specifications-section mt-2">
            <h3 style="font-size: 20px; margin-bottom: 12px;">Specifications</h3>
            <div class="specs-grid" style="display: grid; gap: 8px;">
              ${Object.entries(specifications).map(([key, value]) => `
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px; padding: 8px; background: #f9fafb; border-radius: 4px;">
                  <strong style="text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1').trim()}:</strong>
                  <span>${Array.isArray(value) ? value.join(', ') : value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Reviews section -->
    ${reviews && reviews.length > 0 ? `
      <div class="reviews-section mt-2">
        <h3 style="font-size: 24px; margin-bottom: 16px;">Customer Reviews</h3>
        <div class="reviews-list">
          ${reviews.map(review => `
            <div class="review card mb-1">
              <div class="review-header flex justify-between align-center mb-1">
                <strong>${review.user}</strong>
                <span style="color: #f59e0b;">${renderStars(review.rating)}</span>
              </div>
              <p style="color: var(--text-color); opacity: 0.8;">${review.comment}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    
    <!-- Action bar at bottom -->
    <div class="actions-bar flex justify-between align-center mt-2" 
         style="padding: 20px; background: #f3f4f6; border-radius: 8px; position: sticky; bottom: 20px;">
      <button class="btn btn-secondary" onclick="history.back()">
        Continue Shopping
      </button>
      <button class="btn" data-action="go-to-cart">
        View Cart
      </button>
    </div>
  `;
}
