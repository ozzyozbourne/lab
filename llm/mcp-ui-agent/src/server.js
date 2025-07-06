// src/server.js - Local web server that serves the generated UI

import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import chalk from 'chalk';

export class LocalServer {
    constructor(port, agent) {
        this.port = port;
        this.agent = agent; // Reference back to the agent for handling actions
        this.app = express();
        this.server = null;
        this.wss = null;
        this.currentHTML = this.getInitialHTML();
        this.clients = new Set();
    }

    async start() {
        // Configure Express middleware
        this.app.use(express.json());
        this.app.use(express.static('public')); // Serve any static assets if needed

        // Enable CORS for local development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        // Main route - serves the current generated UI
        this.app.get('/', (req, res) => {
            res.send(this.currentHTML);
        });

        // API endpoint for handling UI actions
        this.app.post('/api/action', async (req, res) => {
            const { action, data } = req.body;

            try {
                // Delegate to the agent to handle the action
                const result = await this.agent.handleUIAction(action, data);
                res.json(result);
            } catch (error) {
                console.error(chalk.red('Action handler error:'), error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                agent: 'connected',
                uiContext: this.agent.currentContext || 'none'
            });
        });

        // Create HTTP server
        this.server = http.createServer(this.app);

        // Setup WebSocket for live UI updates
        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on('connection', (ws) => {
            console.log(chalk.gray('WebSocket client connected'));
            this.clients.add(ws);

            // Send current UI state immediately
            ws.send(JSON.stringify({
                type: 'ui-update',
                html: this.currentHTML
            }));

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(chalk.gray('WebSocket client disconnected'));
            });

            ws.on('error', (error) => {
                console.error(chalk.red('WebSocket error:'), error);
                this.clients.delete(ws);
            });
        });

        // Start the server
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(chalk.green(`✓ Web server running on port ${this.port}`));
                    resolve();
                }
            });
        });
    }

    // Update the UI and notify all connected clients
    updateUI(html) {
        this.currentHTML = this.wrapWithWebSocket(html);

        // Notify all WebSocket clients about the update
        const message = JSON.stringify({
            type: 'ui-update',
            html: this.currentHTML
        });

        this.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }

    // Add WebSocket client code to enable live updates
    wrapWithWebSocket(html) {
        // Inject WebSocket client script before closing body tag
        const wsScript = `
      <script>
        // WebSocket for live UI updates
        (function() {
          let ws = null;
          let reconnectTimeout = null;
          
          function connect() {
            ws = new WebSocket('ws://localhost:${this.port}');
            
            ws.onopen = () => {
              console.log('Connected to UI server');
              if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
              }
            };
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              
              if (data.type === 'ui-update') {
                // Replace the entire document with new UI
                document.open();
                document.write(data.html);
                document.close();
              }
            };
            
            ws.onclose = () => {
              console.log('Disconnected from UI server');
              // Attempt to reconnect after 2 seconds
              reconnectTimeout = setTimeout(connect, 2000);
            };
            
            ws.onerror = (error) => {
              console.error('WebSocket error:', error);
            };
          }
          
          // Connect immediately
          connect();
        })();
      </script>
    `;

        // Insert the WebSocket script before the closing body tag
        return html.replace('</body>', `${wsScript}</body>`);
    }

    // Initial HTML shown when no UI has been generated yet
    getInitialHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP UI Agent</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f3f4f6;
            color: #1f2937;
        }
        .welcome {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 500px;
        }
        .welcome h1 {
            font-size: 32px;
            margin-bottom: 16px;
            color: #3b82f6;
        }
        .welcome p {
            font-size: 18px;
            color: #6b7280;
            line-height: 1.5;
        }
        .status {
            margin-top: 24px;
            padding: 12px 24px;
            background: #fef3c7;
            color: #92400e;
            border-radius: 8px;
            font-size: 14px;
        }
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f3f4f6;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="welcome">
        <h1>🤖 MCP UI Agent</h1>
        <p>Welcome! Your agent is ready to help you shop.</p>
        <p>Try saying something like:<br>
        <em>"I want to buy blue headphones under $200"</em></p>
        <div class="status">
            <span class="spinner"></span>
            Waiting for your command in the terminal...
        </div>
    </div>
    ${this.wrapWithWebSocket('')}
</body>
</html>`;
    }

    async stop() {
        // Close all WebSocket connections
        this.clients.forEach(client => client.close());

        // Stop the HTTP server
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log(chalk.yellow('Web server stopped'));
                    resolve();
                });
            });
        }
    }
}
