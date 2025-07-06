// src/mcp-client.js - Modified to work with HTTP server instead of stdio

import chalk from 'chalk';

export class MCPClient {
    constructor(serverAddress) {
        this.serverAddress = serverAddress;
        this.baseUrl = `http://${serverAddress}`;
        this.availableTools = new Map();
    }

    async connect() {
        console.log(chalk.gray(`Connecting to HTTP server: ${this.serverAddress}`));

        try {
            // For HTTP mode, we just verify the server is reachable
            await this.discoverTools();

            console.log(chalk.green(`✓ Connected to HTTP server`));
            console.log(chalk.gray(`  Available tools: ${Array.from(this.availableTools.keys()).join(', ')}`));

        } catch (error) {
            console.error(chalk.red('Failed to connect to HTTP server:'), error);
            throw error;
        }
    }

    async discoverTools() {
        try {
            // Make HTTP request to discover tools
            const response = await fetch(`${this.baseUrl}/tools/list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.tools) {
                data.tools.forEach(tool => {
                    this.availableTools.set(tool.name, tool);
                });
            }
        } catch (error) {
            console.error(chalk.red('Failed to discover tools:'), error);
            throw error;
        }
    }

    async callTool(toolName, args) {
        if (!this.availableTools.has(toolName)) {
            throw new Error(`Tool '${toolName}' not available on this server`);
        }

        try {
            // Make HTTP request to call the tool
            const response = await fetch(`${this.baseUrl}/tools/call`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: toolName,
                    arguments: args
                })
            });

            const data = await response.json();

            // Parse the response similar to MCP format
            if (data.content && data.content.length > 0) {
                const content = data.content[0];

                if (content.type === 'text') {
                    try {
                        return JSON.parse(content.text);
                    } catch (e) {
                        return { success: true, data: content.text };
                    }
                }
            }

            return { success: false, error: 'No content in response' };

        } catch (error) {
            console.error(chalk.red(`Tool call failed for ${toolName}:`), error);
            return { success: false, error: error.message };
        }
    }

    async disconnect() {
        // For HTTP, there's nothing to disconnect
        console.log(chalk.gray('Disconnected from HTTP server'));
    }

    getToolInfo(toolName) {
        return this.availableTools.get(toolName);
    }

    listTools() {
        return Array.from(this.availableTools.values());
    }
}
