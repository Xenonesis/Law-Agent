#!/usr/bin/env node
/**
 * Enhanced Smart Launcher for Lawyer Bot
 * Cross-platform, error-resistant, and feature-rich startup system
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, exec } = require('child_process');
const os = require('os');

class SmartLauncher {
    constructor() {
        this.config = {
            preferredPorts: {
                backend: 9002,
                frontend: 3000
            },
            portRange: {
                backend: { start: 9000, end: 9999 },
                frontend: { start: 3000, end: 3999 }
            },
            retryAttempts: 3,
            retryDelay: 2000,
            timeout: 30000
        };
        
        this.processes = new Map();
        this.isWindows = os.platform() === 'win32';
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m'
        };
    }

    log(message, color = 'reset') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`${this.colors[color]}[${timestamp}] ${message}${this.colors.reset}`);
    }

    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            server.on('error', () => resolve(false));
        });
    }

    async findAvailablePort(startPort, endPort) {
        for (let port = startPort; port <= endPort; port++) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        throw new Error(`No available ports found in range ${startPort}-${endPort}`);
    }

    async getProcessOnPort(port) {
        return new Promise((resolve) => {
            const command = this.isWindows 
                ? `netstat -ano | findstr :${port}`
                : `lsof -ti:${port}`;
            
            exec(command, (error, stdout) => {
                if (error || !stdout.trim()) {
                    resolve(null);
                    return;
                }

                if (this.isWindows) {
                    const lines = stdout.trim().split('\n');
                    const tcpLine = lines.find(line => line.includes('LISTENING'));
                    if (tcpLine) {
                        const pid = tcpLine.trim().split(/\s+/).pop();
                        resolve({ pid: parseInt(pid) });
                    } else {
                        resolve(null);
                    }
                } else {
                    const pid = parseInt(stdout.trim().split('\n')[0]);
                    resolve({ pid });
                }
            });
        });
    }

    async killProcessOnPort(port) {
        const processInfo = await this.getProcessOnPort(port);
        if (!processInfo) {
            return false;
        }

        return new Promise((resolve) => {
            const command = this.isWindows 
                ? `taskkill /F /PID ${processInfo.pid}`
                : `kill -9 ${processInfo.pid}`;
            
            exec(command, (error) => {
                if (error) {
                    this.log(`Failed to kill process ${processInfo.pid}: ${error.message}`, 'red');
                    resolve(false);
                } else {
                    this.log(`Successfully killed process ${processInfo.pid} on port ${port}`, 'green');
                    resolve(true);
                }
            });
        });
    }

    async updateBackendPort(port) {
        const envFile = path.join('backend', '.env');
        
        try {
            let envContent = '';
            if (fs.existsSync(envFile)) {
                envContent = fs.readFileSync(envFile, 'utf8');
            }

            // Update or add PORT
            if (envContent.includes('PORT=')) {
                envContent = envContent.replace(/^PORT=.*/m, `PORT=${port}`);
            } else {
                envContent += `\nPORT=${port}`;
            }

            fs.writeFileSync(envFile, envContent.trim() + '\n');
            this.log(`Updated backend port to ${port}`, 'green');
            return true;
        } catch (error) {
            this.log(`Failed to update backend port: ${error.message}`, 'red');
            return false;
        }
    }

    async updateFrontendConfig(frontendPort, backendPort) {
        const envFile = path.join('frontend', '.env');
        
        try {
            let envContent = '';
            if (fs.existsSync(envFile)) {
                envContent = fs.readFileSync(envFile, 'utf8');
            }

            // Update or add PORT
            if (envContent.includes('PORT=')) {
                envContent = envContent.replace(/^PORT=.*/m, `PORT=${frontendPort}`);
            } else {
                envContent += `\nPORT=${frontendPort}`;
            }

            // Update or add REACT_APP_API_URL
            const apiUrl = `http://localhost:${backendPort}`;
            if (envContent.includes('REACT_APP_API_URL=')) {
                envContent = envContent.replace(/^REACT_APP_API_URL=.*/m, `REACT_APP_API_URL=${apiUrl}`);
            } else {
                envContent += `\nREACT_APP_API_URL=${apiUrl}`;
            }

            fs.writeFileSync(envFile, envContent.trim() + '\n');
            this.log(`Updated frontend config: PORT=${frontendPort}, API_URL=${apiUrl}`, 'green');
            return true;
        } catch (error) {
            this.log(`Failed to update frontend config: ${error.message}`, 'red');
            return false;
        }
    }

    async promptUser(question, options = []) {
        return new Promise((resolve) => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            if (options.length > 0) {
                console.log(question);
                options.forEach((option, index) => {
                    console.log(`${index + 1}. ${option}`);
                });
                readline.question('\nEnter your choice: ', (answer) => {
                    readline.close();
                    resolve(answer.trim());
                });
            } else {
                readline.question(question + ' ', (answer) => {
                    readline.close();
                    resolve(answer.trim());
                });
            }
        });
    }

    async handlePortConflicts(backendPort, frontendPort, autoKill = false) {
        const backendAvailable = await this.isPortAvailable(backendPort);
        const frontendAvailable = await this.isPortAvailable(frontendPort);

        if (backendAvailable && frontendAvailable) {
            return { backend: backendPort, frontend: frontendPort };
        }

        this.log('Port conflicts detected:', 'yellow');
        if (!backendAvailable) {
            this.log(`  Backend port ${backendPort} is in use`, 'red');
        }
        if (!frontendAvailable) {
            this.log(`  Frontend port ${frontendPort} is in use`, 'red');
        }

        if (autoKill) {
            this.log('Auto-killing conflicting processes...', 'yellow');
            if (!backendAvailable) await this.killProcessOnPort(backendPort);
            if (!frontendAvailable) await this.killProcessOnPort(frontendPort);
            
            // Wait and recheck
            await new Promise(resolve => setTimeout(resolve, 2000));
            const newBackendAvailable = await this.isPortAvailable(backendPort);
            const newFrontendAvailable = await this.isPortAvailable(frontendPort);
            
            if (newBackendAvailable && newFrontendAvailable) {
                return { backend: backendPort, frontend: frontendPort };
            }
        }

        const choice = await this.promptUser(
            'How would you like to resolve the conflicts?',
            [
                'Kill existing processes and use preferred ports',
                'Find alternative available ports',
                'Exit and handle manually'
            ]
        );

        switch (choice) {
            case '1':
                if (!backendAvailable) await this.killProcessOnPort(backendPort);
                if (!frontendAvailable) await this.killProcessOnPort(frontendPort);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return { backend: backendPort, frontend: frontendPort };
            
            case '2':
                const newBackendPort = backendAvailable ? backendPort : 
                    await this.findAvailablePort(this.config.portRange.backend.start, this.config.portRange.backend.end);
                const newFrontendPort = frontendAvailable ? frontendPort : 
                    await this.findAvailablePort(this.config.portRange.frontend.start, this.config.portRange.frontend.end);
                
                this.log(`Using alternative ports: Backend=${newBackendPort}, Frontend=${newFrontendPort}`, 'cyan');
                return { backend: newBackendPort, frontend: newFrontendPort };
            
            default:
                this.log('Exiting...', 'yellow');
                process.exit(0);
        }
    }

    async startBackend(port) {
        return new Promise((resolve, reject) => {
            this.log(`Starting backend server on port ${port}...`, 'blue');
            
            const pythonCmd = this.isWindows ? 'python' : 'python3';
            const backend = spawn(pythonCmd, ['fixed_server.py'], {
                cwd: 'backend',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.processes.set('backend', backend);

            let startupTimeout = setTimeout(() => {
                this.log('Backend startup timeout', 'red');
                reject(new Error('Backend startup timeout'));
            }, this.config.timeout);

            backend.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`${this.colors.blue}[Backend]${this.colors.reset} ${output.trim()}`);
                
                if (output.includes('Server running at') || 
                    output.includes('Starting Multi-LLM Lawyer Bot server') ||
                    output.includes('Health check endpoint:') ||
                    output.includes('Available LLM providers:')) {
                    clearTimeout(startupTimeout);
                    this.log(`Backend server started successfully on port ${port}`, 'green');
                    resolve(backend);
                }
            });

            backend.stderr.on('data', (data) => {
                const error = data.toString();
                console.error(`${this.colors.red}[Backend Error]${this.colors.reset} ${error.trim()}`);
                
                // Also check stderr for startup messages (some Python servers output to stderr)
                if (error.includes('Server running at') || 
                    error.includes('Starting Multi-LLM Lawyer Bot server') ||
                    error.includes('Health check endpoint:') ||
                    error.includes('Available LLM providers:')) {
                    clearTimeout(startupTimeout);
                    this.log(`Backend server started successfully on port ${port}`, 'green');
                    resolve(backend);
                }
            });

            backend.on('error', (error) => {
                clearTimeout(startupTimeout);
                this.log(`Backend startup error: ${error.message}`, 'red');
                reject(error);
            });

            backend.on('exit', (code) => {
                clearTimeout(startupTimeout);
                if (code !== 0) {
                    this.log(`Backend exited with code ${code}`, 'red');
                    reject(new Error(`Backend exited with code ${code}`));
                }
            });
        });
    }

    async startFrontend(port) {
        return new Promise((resolve, reject) => {
            this.log(`Starting frontend server on port ${port}...`, 'blue');
            
            // Use npm.cmd on Windows, npm on Unix
            const npmCommand = this.isWindows ? 'npm.cmd' : 'npm';
            
            const frontend = spawn(npmCommand, ['start'], {
                cwd: 'frontend',
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, PORT: port.toString() },
                shell: this.isWindows
            });

            this.processes.set('frontend', frontend);

            let startupTimeout = setTimeout(() => {
                this.log('Frontend startup timeout', 'red');
                reject(new Error('Frontend startup timeout'));
            }, this.config.timeout);

            frontend.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`${this.colors.magenta}[Frontend]${this.colors.reset} ${output.trim()}`);
                
                if (output.includes('webpack compiled') || output.includes('Local:') || output.includes(`localhost:${port}`)) {
                    clearTimeout(startupTimeout);
                    this.log(`Frontend server started successfully on port ${port}`, 'green');
                    resolve(frontend);
                }
            });

            frontend.stderr.on('data', (data) => {
                const error = data.toString();
                if (!error.includes('Warning') && !error.includes('warning')) {
                    console.error(`${this.colors.red}[Frontend Error]${this.colors.reset} ${error.trim()}`);
                }
            });

            frontend.on('error', (error) => {
                clearTimeout(startupTimeout);
                this.log(`Frontend startup error: ${error.message}`, 'red');
                reject(error);
            });

            frontend.on('exit', (code) => {
                clearTimeout(startupTimeout);
                if (code !== 0) {
                    this.log(`Frontend exited with code ${code}`, 'red');
                    reject(new Error(`Frontend exited with code ${code}`));
                }
            });
        });
    }

    async checkDependencies() {
        const checks = [
            { name: 'Node.js', command: 'node --version' },
            { name: 'npm', command: 'npm --version' },
            { name: 'Python', command: this.isWindows ? 'python --version' : 'python3 --version' }
        ];

        this.log('Checking dependencies...', 'cyan');
        
        for (const check of checks) {
            try {
                await new Promise((resolve, reject) => {
                    exec(check.command, (error, stdout) => {
                        if (error) reject(error);
                        else resolve(stdout.trim());
                    });
                });
                this.log(`✓ ${check.name} is available`, 'green');
            } catch (error) {
                this.log(`✗ ${check.name} is not available`, 'red');
                throw new Error(`${check.name} is required but not found`);
            }
        }
    }

    setupGracefulShutdown() {
        const shutdown = () => {
            this.log('Shutting down servers...', 'yellow');
            
            for (const [name, process] of this.processes) {
                try {
                    this.log(`Stopping ${name}...`, 'yellow');
                    if (this.isWindows) {
                        spawn('taskkill', ['/pid', process.pid.toString(), '/f', '/t']);
                    } else {
                        process.kill('SIGTERM');
                    }
                } catch (error) {
                    this.log(`Error stopping ${name}: ${error.message}`, 'red');
                }
            }
            
            setTimeout(() => {
                this.log('Goodbye!', 'cyan');
                process.exit(0);
            }, 1000);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        process.on('exit', shutdown);
    }

    async run(options = {}) {
        try {
            this.log('🚀 Enhanced Smart Launcher for Private Lawyer Bot v2.0', 'cyan');
            this.log('='.repeat(60), 'cyan');

            // Pre-flight checks
            await this.runPreflightChecks();

            // Check dependencies
            await this.checkDependencies();

            // Handle port conflicts
            const ports = await this.handlePortConflicts(
                this.config.preferredPorts.backend,
                this.config.preferredPorts.frontend,
                options.autoKill
            );

            // Update configuration files
            await this.updateBackendPort(ports.backend);
            await this.updateFrontendConfig(ports.frontend, ports.backend);

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            // Start performance monitoring
            this.startPerformanceMonitoring();

            // Start servers
            if (!options.backendOnly) {
                await this.startBackend(ports.backend);
                await this.startFrontend(ports.frontend);
                
                // Wait for both servers to be ready
                await this.waitForServersReady(ports);
            } else {
                await this.startBackend(ports.backend);
                await this.waitForBackendReady(ports.backend);
            }

            // Success message with enhanced info
            this.displaySuccessMessage(ports, options);

            // Start health monitoring
            this.startHealthMonitoring(ports);

            // Keep the process alive
            await new Promise(() => {});

        } catch (error) {
            this.log(`Fatal error: ${error.message}`, 'red');
            this.log('Run "npm run health" for detailed diagnostics', 'yellow');
            process.exit(1);
        }
    }

    async runPreflightChecks() {
        this.log('Running preflight checks...', 'blue');
        
        // Check if required files exist
        const requiredFiles = [
            'backend/requirements.txt',
            'frontend/package.json',
            'package.json'
        ];
        
        for (const file of requiredFiles) {
            if (!require('fs').existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
        
        this.log('✓ Preflight checks passed', 'green');
    }

    async waitForServersReady(ports) {
        this.log('Waiting for servers to be ready...', 'blue');
        
        const maxAttempts = 30;
        const delay = 1000;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Check backend health
                const backendReady = await this.checkServerHealth(`http://localhost:${ports.backend}/api/health`);
                
                if (backendReady) {
                    this.log('✓ All servers are ready!', 'green');
                    return;
                }
            } catch (error) {
                // Continue waiting
            }
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        this.log('⚠️  Servers may still be starting up', 'yellow');
    }

    async waitForBackendReady(port) {
        this.log('Waiting for backend to be ready...', 'blue');
        
        const maxAttempts = 20;
        const delay = 1000;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const ready = await this.checkServerHealth(`http://localhost:${port}/api/health`);
                if (ready) {
                    this.log('✓ Backend is ready!', 'green');
                    return;
                }
            } catch (error) {
                // Continue waiting
            }
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        this.log('⚠️  Backend may still be starting up', 'yellow');
    }

    async checkServerHealth(url) {
        return new Promise((resolve) => {
            const http = require('http');
            const req = http.get(url, { timeout: 2000 }, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    startPerformanceMonitoring() {
        this.performanceMetrics = {
            startTime: Date.now(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
    }

    startHealthMonitoring(ports) {
        // Monitor server health every 30 seconds
        this.healthMonitor = setInterval(async () => {
            try {
                const backendHealthy = await this.checkServerHealth(`http://localhost:${ports.backend}/api/health`);
                
                if (!backendHealthy) {
                    this.log('⚠️  Backend health check failed', 'yellow');
                }
            } catch (error) {
                // Ignore monitoring errors
            }
        }, 30000);
    }

    displaySuccessMessage(ports, options) {
        this.log('\n' + '='.repeat(60), 'green');
        this.log('🎉 PRIVATE LAWYER BOT STARTED SUCCESSFULLY!', 'green');
        this.log('='.repeat(60), 'green');
        
        this.log('\n📍 ACCESS POINTS:', 'cyan');
        if (!options.backendOnly) {
            this.log(`   🌐 Frontend App:     http://localhost:${ports.frontend}`, 'cyan');
        }
        this.log(`   🔧 Backend API:      http://localhost:${ports.backend}`, 'cyan');
        this.log(`   🏥 Health Check:     http://localhost:${ports.backend}/api/health`, 'cyan');
        this.log(`   📚 API Docs:         http://localhost:${ports.backend}/docs`, 'cyan');
        
        this.log('\n🛠️  DEVELOPMENT TOOLS:', 'blue');
        this.log('   • npm run health      - System health check', 'blue');
        this.log('   • npm run port:status - Check port usage', 'blue');
        this.log('   • npm run deploy:check - Deployment readiness', 'blue');
        
        this.log('\n💡 TIPS:', 'yellow');
        this.log('   • Configure your API keys in Settings for AI features', 'yellow');
        this.log('   • Check the README.md for detailed setup instructions', 'yellow');
        this.log('   • Use Ctrl+C to stop all servers gracefully', 'yellow');
        
        this.log('\n🚀 Ready for development! Happy coding!', 'magenta');
        this.log('\nPress Ctrl+C to stop the servers', 'yellow');
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        autoKill: args.includes('--kill') || args.includes('-k'),
        backendOnly: args.includes('--backend-only') || args.includes('-b'),
        help: args.includes('--help') || args.includes('-h')
    };

    if (options.help) {
        console.log(`
Enhanced Smart Launcher for Lawyer Bot

Usage: node smart-launcher.js [options]

Options:
  --kill, -k           Automatically kill processes on conflicting ports
  --backend-only, -b   Start only the backend server
  --help, -h           Show this help message

Examples:
  node smart-launcher.js                    # Interactive startup
  node smart-launcher.js --kill             # Auto-kill conflicts
  node smart-launcher.js --backend-only     # Backend only
        `);
        process.exit(0);
    }

    const launcher = new SmartLauncher();
    launcher.run(options);
}

module.exports = SmartLauncher;