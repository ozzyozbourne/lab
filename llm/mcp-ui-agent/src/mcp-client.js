// src/mcp-client.js - Handles communication with MCP servers

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import chalk from 'chalk';

export class MCPClient {
    constructor(serverAddress) {
        this.serverAddress = serverAddress;
        this.client = null;
        this.transport = null;
        this.serverProcess = null;
        this.availableTools = new Map();
    }

    async connect() {
        console.log(chalk.gray(`Connecting to MCP server: ${this.serverAddress}`));

        try {
            // For this MVP, we'll assume the server address is a local path to the server script
            // In production, this could be a network address or a more complex connection string

            if (this.serverAddress.includes(':')) {
                // It's a port number, so spawn our mock server
                await this.connectToLocalServer();
            } else {
                // It's a path to an MCP server executable
                await this.connectToExecutable();
            }

            // Discover available tools
            await this.discoverTools();

            console.log(chalk.green(`✓ Connected to MCP server`));
            console.log(chalk.gray(`  Available tools: ${Array.from(this.availableTools.keys()).join(', ')}`));

        } catch (error) {
            console.error(chalk.red('Failed to connect to MCP server:'), error);
            throw error;
        }
    }

    async connectToLocalServer() {
        // Spawn the mock Amazon server as a subprocess
        const serverPath = new URL('../mcp-servers/amazon-mock/server.js', import.meta.url).pathname;

        this.serverProcess = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        // Create transport using the subprocess's stdio
        this.transport = new StdioClientTransport({
            stdioTransport: {
                stdin: this.serverProcess.stdin,
                stdout: this.serverProcess.stdout,
                stderr: this.serverProcess.stderr
            }
        });

        // Initialize the MCP client
        this.client = new Client({
            name: 'mcp-ui-agent',
            version: '1.0.0'
        }, {
            capabilities: {}
        });

        // Connect the client to the transport
        await this.client.connect(this.transport);

        // Handle server process errors
        this.serverProcess.on('error', (error) => {
            console.error(chalk.red('Server process error:'), error);
        });

        this.serverProcess.stderr.on('data', (data) => {
            // Server logs go to stderr by convention
            const message = data.toString().trim();
            if (message && !message.includes('MCP Server running')) {
                console.log(chalk.gray(`[Server] ${message}`));
            }
        });
    }

    async connectToExecutable() {
        // This path would be used for connecting to a standalone MCP server executable
        throw new Error('Executable connection not implemented in MVP');
    }

    async discoverTools() {
        // Request the list of available tools from the server
        const response = await this.client.request('tools/list', {});

        if (response.tools) {
            response.tools.forEach(tool => {
                this.availableTools.set(tool.name, tool);
            });
        }
    }

    async callTool(toolName, args) {
        // Check if tool exists
        if (!this.availableTools.has(toolName)) {
            throw new Error(`Tool '${toolName}' not available on this server`);
        }

        try {
            // Make the tool call through MCP protocol
            const response = await this.client.request('tools/call', {
                name: toolName,
                arguments: args
            });

            // Parse the response - MCP returns content as an array
            if (response.content && response.content.length > 0) {
                const content = response.content[0];

                if (content.type === 'text') {
                    // Parse JSON response from the tool
                    try {
                        return JSON.parse(content.text);
                    } catch (e) {
                        // If not JSON, return as-is
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
        if (this.client) {
            await this.client.close();
        }

        if (this.serverProcess) {
            this.serverProcess.kill();
        }
    }

    // Helper method to validate tool arguments against schema
    validateToolArgs(toolName, args) {
        const tool = this.availableTools.get(toolName);
        if (!tool || !tool.inputSchema) return true;

        // Basic validation - in production, use a proper JSON schema validator
        const required = tool.inputSchema.required || [];
        for (const field of required) {
            if (!(field in args)) {
                throw new Error(`Missing required field '${field}' for tool '${toolName}'`);
            }
        }

        return true;
    }

    // Get tool information for UI generation hints
    getToolInfo(toolName) {
        return this.availableTools.get(toolName);
    }

    // List all available tools (useful for debugging and UI generation)
    listTools() {
        return Array.from(this.availableTools.values());
    }
}
