#!/usr/bin/env node
// index.js - Main CLI entry point

import { program } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Agent } from './src/agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Helper function to load style rules
async function loadStyleRules(rulesPath) {
    try {
        // If no path provided, use default rules
        if (!rulesPath) {
            rulesPath = join(__dirname, 'config', 'default-rules.json');
        }

        const rulesContent = await readFile(rulesPath, 'utf-8');
        return JSON.parse(rulesContent);
    } catch (error) {
        console.error(chalk.red(`Failed to load style rules from ${rulesPath}:`), error.message);
        process.exit(1);
    }
}

// Setup CLI commands
program
    .name('mcp-agent')
    .description('A CLI agent that generates dynamic UIs from MCP server data')
    .version('0.1.0');

program
    .command('connect <server>')
    .description('Connect to an MCP server and start interactive session')
    .option('-r, --rules <path>', 'Path to style rules JSON file')
    .option('-p, --port <port>', 'Port for local web server', '3000')
    .action(async (server, options) => {
        console.log(chalk.blue('🤖 MCP UI Agent Starting...'));
        console.log(chalk.gray(`Connecting to: ${server}`));

        // Load style rules
        const styleRules = await loadStyleRules(options.rules);
        console.log(chalk.green('✓ Style rules loaded'));

        try {
            // Initialize the agent with configuration
            const agent = new Agent({
                mcpServer: server,
                styleRules: styleRules,
                port: parseInt(options.port)
            });

            // Start the agent
            await agent.start();

            console.log(chalk.green('\n✨ Agent is ready!'));
            console.log(chalk.cyan(`Web UI available at: http://localhost:${options.port}`));
            console.log(chalk.gray('\nTry saying: "I want to buy blue headphones under $200"\n'));

        } catch (error) {
            console.error(chalk.red('Failed to start agent:'), error.message);
            process.exit(1);
        }
    });

program
    .command('shop <query>')
    .description('Quick shopping query without interactive mode')
    .option('-r, --rules <path>', 'Path to style rules JSON file')
    .option('-s, --server <server>', 'MCP server to connect to', 'localhost:3001')
    .action(async (query, options) => {
        console.log(chalk.blue('🛍️  Quick Shop Mode'));

        const styleRules = await loadStyleRules(options.rules);

        try {
            const agent = new Agent({
                mcpServer: options.server,
                styleRules: styleRules,
                port: 3000
            });

            // Process the query directly
            await agent.processQuery(query);

        } catch (error) {
            console.error(chalk.red('Shopping failed:'), error.message);
            process.exit(1);
        }
    });

// Example command to show available style presets
program
    .command('styles')
    .description('List available style presets')
    .action(async () => {
        console.log(chalk.blue('📎 Available Style Presets:\n'));

        const styles = [
            { name: 'default', desc: 'Clean, modern design with blue accents' },
            { name: 'minimal', desc: 'Minimalist black and white theme' },
            { name: 'retro-90s', desc: 'Nostalgic 90s web aesthetic' },
            { name: 'modern-blue', desc: 'Contemporary design with blue palette' }
        ];

        styles.forEach(style => {
            console.log(chalk.yellow(`  ${style.name}`) + chalk.gray(` - ${style.desc}`));
        });

        console.log(chalk.gray('\nUse with: mcp-agent connect <server> --rules examples/style-rules/<name>.json'));
    });

// Handle no command
if (!process.argv.slice(2).length) {
    program.outputHelp();
}

program.parse(process.argv);
