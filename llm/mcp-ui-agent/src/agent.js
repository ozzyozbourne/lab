// src/agent.js - The brain of the system that orchestrates everything

import { MCPClient } from './mcp-client.js';
import { UIGenerator } from './ui-generator.js';
import { LocalServer } from './server.js';
import readline from 'readline';
import chalk from 'chalk';
import open from 'open';

export class Agent {
    constructor(config) {
        this.config = config;
        this.mcpClient = new MCPClient(config.mcpServer);
        this.uiGenerator = new UIGenerator(config.styleRules);
        this.server = new LocalServer(config.port, this);

        // Current context - this represents the "data shape" state
        this.currentContext = null;
        this.currentData = null;

        // Natural language patterns for understanding user intent
        this.intentPatterns = [
            {
                pattern: /(?:i want to |i'd like to |show me |find me |search for |look for )(.+)/i,
                action: 'search'
            },
            {
                pattern: /(?:buy|purchase|add to cart|order) (.+)/i,
                action: 'buy'
            },
            {
                pattern: /(?:show|view|see) (?:my |the )?cart/i,
                action: 'view_cart'
            },
            {
                pattern: /checkout|complete (?:my )?order|pay/i,
                action: 'checkout'
            }
        ];
    }

    async start() {
        // Connect to MCP server
        await this.mcpClient.connect();

        // Start local web server
        await this.server.start();

        // Open browser automatically
        await open(`http://localhost:${this.config.port}`);

        // Start interactive CLI
        this.startInteractiveMode();
    }

    startInteractiveMode() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan('You: ')
        });

        console.log(chalk.gray('Type your request or "exit" to quit.\n'));
        rl.prompt();

        rl.on('line', async (input) => {
            const trimmedInput = input.trim();

            if (trimmedInput.toLowerCase() === 'exit') {
                console.log(chalk.yellow('\nGoodbye! 👋'));
                process.exit(0);
            }

            // Process the user's natural language input
            await this.processQuery(trimmedInput);

            rl.prompt();
        });
    }

    async processQuery(query) {
        console.log(chalk.gray(`\nAgent: Processing "${query}"...`));

        try {
            // Parse user intent from natural language
            const intent = this.parseIntent(query);

            if (!intent) {
                console.log(chalk.yellow('I didn\'t understand that. Try saying something like "I want to buy headphones"'));
                return;
            }

            // Execute the appropriate action based on intent
            await this.executeIntent(intent);

        } catch (error) {
            console.error(chalk.red('Error processing query:'), error.message);
        }
    }

    parseIntent(query) {
        // Try to match against known patterns
        for (const { pattern, action } of this.intentPatterns) {
            const match = query.match(pattern);
            if (match) {
                return {
                    action,
                    query: match[1] || query,
                    fullQuery: query
                };
            }
        }

        // Default to search if query contains product-like terms
        if (query.match(/headphones|laptop|phone|tablet|watch|camera/i)) {
            return {
                action: 'search',
                query: query,
                fullQuery: query
            };
        }

        return null;
    }

    async executeIntent(intent) {
        switch (intent.action) {
            case 'search':
                await this.handleSearch(intent.query);
                break;

            case 'buy':
                await this.handleBuyRequest(intent.query);
                break;

            case 'view_cart':
                await this.handleViewCart();
                break;

            case 'checkout':
                await this.handleCheckout();
                break;

            default:
                console.log(chalk.yellow('Action not implemented yet'));
        }
    }

    async handleSearch(query) {
        console.log(chalk.blue(`🔍 Searching for: ${query}`));

        // Parse the query to extract filters
        const filters = this.extractFilters(query);

        // Call the MCP server's search_products tool
        const result = await this.mcpClient.callTool('search_products', {
            query: filters.searchTerm,
            filters: filters.filters
        });

        if (result.success && result.data.products.length > 0) {
            // Update our context - we now have a product list
            this.currentContext = 'product-list';
            this.currentData = result.data;

            // Generate UI for this data shape
            const html = this.uiGenerator.generate(this.currentContext, this.currentData);

            // Serve the generated UI
            this.server.updateUI(html);

            console.log(chalk.green(`✓ Found ${result.data.products.length} products`));
            console.log(chalk.cyan(`View them at: http://localhost:${this.config.port}`));
        } else {
            console.log(chalk.yellow('No products found matching your criteria'));
        }
    }

    extractFilters(query) {
        const filters = {};
        let searchTerm = query;

        // Extract price constraints
        const priceMatch = query.match(/under \$?(\d+)|less than \$?(\d+)|below \$?(\d+)/i);
        if (priceMatch) {
            filters.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
            searchTerm = searchTerm.replace(priceMatch[0], '').trim();
        }

        // Extract color
        const colors = ['blue', 'black', 'white', 'red', 'green', 'silver', 'gold'];
        for (const color of colors) {
            if (query.toLowerCase().includes(color)) {
                filters.color = color;
                searchTerm = searchTerm.replace(new RegExp(color, 'i'), '').trim();
            }
        }

        // Extract brand names
        const brands = ['sony', 'bose', 'apple', 'beats', 'jbl', 'samsung', 'microsoft'];
        for (const brand of brands) {
            if (query.toLowerCase().includes(brand)) {
                filters.brand = brand;
                searchTerm = searchTerm.replace(new RegExp(brand, 'i'), '').trim();
            }
        }

        return { searchTerm, filters };
    }

    async handleBuyRequest(query) {
        // If we don't have product data, search first
        if (this.currentContext !== 'product-list') {
            await this.handleSearch(query);
        }
    }

    async handleViewCart() {
        console.log(chalk.blue('🛒 Fetching cart...'));

        const result = await this.mcpClient.callTool('get_cart', {});

        if (result.success) {
            this.currentContext = 'cart';
            this.currentData = result.data;

            const html = this.uiGenerator.generate(this.currentContext, this.currentData);
            this.server.updateUI(html);

            console.log(chalk.green(`✓ Cart has ${result.data.itemCount} items`));
        }
    }

    async handleCheckout() {
        console.log(chalk.blue('💳 Processing checkout...'));

        // First get cart to ensure we have items
        const cartResult = await this.mcpClient.callTool('get_cart', {});

        if (!cartResult.success || cartResult.data.items.length === 0) {
            console.log(chalk.yellow('Your cart is empty!'));
            return;
        }

        // For MVP, use mock payment/shipping info
        const checkoutResult = await this.mcpClient.callTool('checkout', {
            paymentInfo: {
                cardNumber: '4111111111111111',
                cvv: '123',
                expiryDate: '12/25'
            },
            shippingInfo: {
                address: '123 Main St',
                city: 'Dallas',
                zipCode: '75001'
            }
        });

        if (checkoutResult.success) {
            this.currentContext = 'order-confirmation';
            this.currentData = checkoutResult.data;

            const html = this.uiGenerator.generate(this.currentContext, this.currentData);
            this.server.updateUI(html);

            console.log(chalk.green('✓ Order placed successfully!'));
            console.log(chalk.cyan(`Order ID: ${checkoutResult.data.orderId}`));
        }
    }

    // API methods called by the web UI
    async handleUIAction(action, data) {
        console.log(chalk.gray(`UI Action: ${action}`), data);

        switch (action) {
            case 'add-to-cart':
                const result = await this.mcpClient.callTool('add_to_cart', {
                    productId: data.productId,
                    quantity: data.quantity || 1
                });

                if (result.success) {
                    return { success: true, message: result.data.message };
                }
                break;

            case 'view-details':
                const detailResult = await this.mcpClient.callTool('get_product_details', {
                    productId: data.productId
                });

                if (detailResult.success) {
                    this.currentContext = 'product-detail';
                    this.currentData = detailResult.data;

                    const html = this.uiGenerator.generate(this.currentContext, this.currentData);
                    this.server.updateUI(html);

                    return { success: true, action: 'ui-updated' };
                }
                break;

            case 'go-to-cart':
                await this.handleViewCart();
                return { success: true, action: 'ui-updated' };

            case 'checkout':
                await this.handleCheckout();
                return { success: true, action: 'ui-updated' };

            default:
                return { success: false, error: 'Unknown action' };
        }
    }
}
