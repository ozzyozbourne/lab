// src/templates/product-list.js - Template for displaying product search results

export function productListTemplate(data, styleRules) {
    const { products, totalCount } = data;

    // Helper function to format price
    const formatPrice = (price) => `$${price.toFixed(2)}`;

    // Helper function to generate star rating
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

    // Generate the HTML for the product list
    return `
    <div class="header">
      <h1>Search Results</h1>
      <p class="text-muted">Found ${totalCount} product${totalCount !== 1 ? 's' : ''}</p>
    </div>
    
    <div class="product-grid">
      ${products.map(product => `
        <div class="card product-card" data-product-id="${product.id}">
          <div class="product-image-container">
            <img src="${product.image}" alt="${product.name}" class="product-image" 
                 style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px;">
          </div>
          
          <div class="product-info mt-1">
            <h3 class="product-name" style="font-size: 18px; margin-bottom: 8px;">
              ${product.name}
            </h3>
            
            <div class="product-meta text-muted" style="font-size: 14px;">
              <span class="brand">${product.brand}</span>
              ${product.color ? `<span> • ${product.color}</span>` : ''}
            </div>
            
            <div class="product-rating mt-1" style="color: #f59e0b;">
              <span class="stars">${renderStars(product.rating)}</span>
              <span class="rating-value text-muted" style="font-size: 14px; margin-left: 8px;">
                ${product.rating}
              </span>
            </div>
            
            <p class="product-description mt-1 text-muted" style="font-size: 14px; line-height: 1.4;">
              ${product.description}
            </p>
            
            <div class="product-footer flex justify-between align-center mt-2">
              <div class="price" style="font-size: 24px; font-weight: bold; color: var(--primary-color);">
                ${formatPrice(product.price)}
              </div>
              
              <div class="actions flex gap-1">
                <button class="btn btn-secondary" 
                        data-action="view-details" 
                        data-data='{"productId": "${product.id}"}'>
                  Details
                </button>
                
                <button class="btn" 
                        data-action="add-to-cart" 
                        data-data='{"productId": "${product.id}", "quantity": 1}'
                        ${!product.inStock ? 'disabled' : ''}>
                  ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    ${products.length === 0 ? `
      <div class="empty-state text-center" style="padding: 60px 20px;">
        <h2 style="color: var(--text-color); opacity: 0.6;">No products found</h2>
        <p class="text-muted mt-1">Try adjusting your search criteria</p>
      </div>
    ` : ''}
    
    <div class="actions-bar flex justify-between align-center mt-2" 
         style="padding: 20px; background: #f3f4f6; border-radius: 8px;">
      <div class="results-summary">
        Showing ${products.length} of ${totalCount} products
      </div>
      
      <button class="btn" data-action="go-to-cart">
        View Cart
      </button>
    </div>
  `;
}
