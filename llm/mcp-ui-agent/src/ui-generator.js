// src/ui-generator.js - The heart of dynamic UI generation

import { productListTemplate } from './templates/product-list.js';
import { productDetailTemplate } from './templates/product-detail.js';
import { cartTemplate } from './templates/cart.js';
import { checkoutTemplate } from './templates/checkout.js';

export class UIGenerator {
    constructor(styleRules) {
        this.styleRules = styleRules;

        // Map data contexts to their appropriate templates
        this.templates = new Map([
            ['product-list', productListTemplate],
            ['product-detail', productDetailTemplate],
            ['cart', cartTemplate],
            ['order-confirmation', checkoutTemplate]
        ]);

        // Data shape detectors - these analyze data to determine context
        this.shapeDetectors = [
            {
                name: 'product-list',
                detect: (data) => data.products && Array.isArray(data.products)
            },
            {
                name: 'product-detail',
                detect: (data) => data.id && data.specifications && !Array.isArray(data)
            },
            {
                name: 'cart',
                detect: (data) => data.items && data.totalAmount !== undefined
            },
            {
                name: 'order-confirmation',
                detect: (data) => data.orderId && data.estimatedDelivery
            }
        ];
    }

    // Main generation method - this is where the magic happens
    generate(context, data) {
        // If no context provided, try to detect from data shape
        if (!context) {
            context = this.detectContext(data);
        }

        // Get the appropriate template
        const template = this.templates.get(context);

        if (!template) {
            // Fallback to a generic data display if no template matches
            return this.generateGenericUI(data);
        }

        // Generate the UI using the template and style rules
        const content = template(data, this.styleRules);

        // Wrap in a complete HTML document with styles
        return this.wrapInDocument(content, context);
    }

    // Automatically detect what kind of UI to generate based on data shape
    detectContext(data) {
        for (const detector of this.shapeDetectors) {
            if (detector.detect(data)) {
                return detector.name;
            }
        }

        return 'generic';
    }

    // Create a complete HTML document with all necessary styles and scripts
    wrapInDocument(content, context) {
        const { theme, layout, components, animations } = this.styleRules;

        // Generate CSS from style rules
        const css = this.generateCSS();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Shopping - ${context}</title>
    <style>
        ${css}
    </style>
</head>
<body>
    <div id="app" class="app-container" data-context="${context}">
        ${content}
    </div>
    
    <script>
        ${this.generateClientScript()}
    </script>
</body>
</html>`;
    }

    // Generate CSS from style rules
    generateCSS() {
        const { theme, layout, components, animations } = this.styleRules;

        // Base CSS with CSS variables for theming
        let css = `
        :root {
            --primary-color: ${theme.primaryColor};
            --bg-color: ${theme.backgroundColor};
            --text-color: ${theme.textColor};
            --font-family: ${theme.fontFamily};
            --spacing-unit: ${layout.spacing === 'compact' ? '8px' : layout.spacing === 'spacious' ? '24px' : '16px'};
            --animation-duration: ${animations.duration === 'fast' ? '0.2s' : animations.duration === 'slow' ? '0.6s' : '0.3s'};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-family);
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }
        
        .app-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-unit);
        }
        
        /* Header styles */
        .header {
            background: var(--primary-color);
            color: white;
            padding: calc(var(--spacing-unit) * 2);
            margin-bottom: calc(var(--spacing-unit) * 2);
            border-radius: ${components.cards.shadow ? '8px' : '0'};
            ${components.cards.shadow ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);' : ''}
        }
        
        /* Button styles based on style rules */
        .btn {
            background: var(--primary-color);
            color: white;
            border: none;
            padding: ${components.buttons.size === 'small' ? '6px 12px' : components.buttons.size === 'large' ? '12px 24px' : '8px 16px'};
            border-radius: ${components.buttons.style === 'rounded' ? '6px' : components.buttons.style === 'pill' ? '999px' : '0'};
            cursor: pointer;
            font-size: ${components.buttons.size === 'small' ? '14px' : components.buttons.size === 'large' ? '18px' : '16px'};
            transition: all var(--animation-duration) ease;
            ${animations.enabled ? '' : 'transition: none;'}
        }
        
        .btn:hover {
            ${animations.enabled ? 'transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2);' : ''}
            opacity: 0.9;
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
        }
        
        /* Grid/List layout styles */
        .product-grid {
            display: ${layout.style === 'list' ? 'flex' : 'grid'};
            ${layout.style === 'list' ? 'flex-direction: column;' : `
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: var(--spacing-unit);
            `}
        }
        
        /* Card styles */
        .card {
            background: white;
            padding: var(--spacing-unit);
            margin-bottom: ${layout.style === 'list' ? 'var(--spacing-unit)' : '0'};
            border-radius: ${components.cards.shadow ? '8px' : '0'};
            ${components.cards.shadow ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);' : ''}
            ${components.cards.border ? 'border: 1px solid #e5e7eb;' : ''}
            ${animations.enabled ? 'transition: all var(--animation-duration) ease;' : ''}
        }
        
        .card:hover {
            ${animations.enabled && components.cards.shadow ? 'box-shadow: 0 8px 16px rgba(0,0,0,0.15);' : ''}
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .product-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* Loading states */
        .loading {
            text-align: center;
            padding: calc(var(--spacing-unit) * 4);
        }
        
        .spinner {
            border: 3px solid var(--bg-color);
            border-top: 3px solid var(--primary-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: ${animations.enabled ? 'spin 1s linear infinite' : 'none'};
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Utility classes */
        .mt-1 { margin-top: var(--spacing-unit); }
        .mt-2 { margin-top: calc(var(--spacing-unit) * 2); }
        .mb-1 { margin-bottom: var(--spacing-unit); }
        .mb-2 { margin-bottom: calc(var(--spacing-unit) * 2); }
        .text-center { text-align: center; }
        .text-muted { opacity: 0.7; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .align-center { align-items: center; }
        .gap-1 { gap: var(--spacing-unit); }
    `;

        // Add style-specific customizations
        if (this.styleRules.customCSS) {
            css += '\n' + this.styleRules.customCSS;
        }

        return css;
    }

    // Generate client-side JavaScript for handling interactions
    generateClientScript() {
        return `
        // Client-side script to handle UI interactions
        const API_BASE = 'http://localhost:${3000}/api';
        
        // Helper function to make API calls back to our agent
        async function callAgent(action, data) {
            try {
                const response = await fetch(\`\${API_BASE}/action\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action, data })
                });
                
                const result = await response.json();
                
                if (result.message) {
                    showNotification(result.message);
                }
                
                if (result.action === 'ui-updated') {
                    // The server will push new UI, just wait
                    setTimeout(() => location.reload(), 500);
                }
                
                return result;
            } catch (error) {
                console.error('API call failed:', error);
                showNotification('Something went wrong', 'error');
            }
        }
        
        // Show notifications to user
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = \`notification notification-\${type}\`;
            notification.textContent = message;
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                background: \${type === 'success' ? 'var(--primary-color)' : '#ef4444'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease;
                z-index: 1000;
            \`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Add event listeners when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            // Handle all button clicks
            document.addEventListener('click', async (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                
                e.preventDefault();
                const action = btn.dataset.action;
                const data = JSON.parse(btn.dataset.data || '{}');
                
                // Disable button during action
                btn.disabled = true;
                btn.style.opacity = '0.5';
                
                await callAgent(action, data);
                
                // Re-enable button
                btn.disabled = false;
                btn.style.opacity = '1';
            });
            
            // Add animations
            const style = document.createElement('style');
            style.textContent = \`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            \`;
            document.head.appendChild(style);
        });
    `;
    }

    // Fallback generic UI generator for unknown data shapes
    generateGenericUI(data) {
        return `
        <div class="header">
            <h1>Data Viewer</h1>
        </div>
        <div class="card">
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
    `;
    }
}
