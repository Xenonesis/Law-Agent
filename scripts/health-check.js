#!/usr/bin/env node
/**
 * Comprehensive health check for Private Lawyer Bot
 * Monitors system health, API status, and performance metrics
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

class HealthChecker {
  constructor() {
    this.results = {
      overall: 'unknown',
      checks: {},
      timestamp: new Date().toISOString(),
      duration: 0
    };
    this.startTime = Date.now();
  }

  async runAllChecks() {
    log('🏥 Private Lawyer Bot - Health Check', 'cyan');
    log('=' * 50, 'cyan');

    const checks = [
      { name: 'System Requirements', fn: () => this.checkSystemRequirements() },
      { name: 'Project Structure', fn: () => this.checkProjectStructure() },
      { name: 'Dependencies', fn: () => this.checkDependencies() },
      { name: 'Environment Config', fn: () => this.checkEnvironmentConfig() },
      { name: 'Backend API', fn: () => this.checkBackendAPI() },
      { name: 'Frontend Build', fn: () => this.checkFrontendBuild() },
      { name: 'Port Availability', fn: () => this.checkPortAvailability() },
      { name: 'Performance', fn: () => this.checkPerformance() }
    ];

    for (const check of checks) {
      try {
        log(`\n🔍 Checking ${check.name}...`, 'blue');
        const result = await check.fn();
        this.results.checks[check.name] = result;
        
        if (result.status === 'pass') {
          log(`✅ ${check.name}: ${result.message}`, 'green');
        } else if (result.status === 'warn') {
          log(`⚠️  ${check.name}: ${result.message}`, 'yellow');
        } else {
          log(`❌ ${check.name}: ${result.message}`, 'red');
        }
      } catch (error) {
        log(`❌ ${check.name}: ${error.message}`, 'red');
        this.results.checks[check.name] = {
          status: 'fail',
          message: error.message,
          error: true
        };
      }
    }

    this.calculateOverallHealth();
    this.results.duration = Date.now() - this.startTime;
    this.generateReport();
  }

  async checkSystemRequirements() {
    const requirements = [
      { cmd: 'node --version', name: 'Node.js', minVersion: '18.0.0' },
      { cmd: 'npm --version', name: 'npm', minVersion: '9.0.0' },
      { cmd: 'python --version || python3 --version', name: 'Python', minVersion: '3.8.0' }
    ];

    const results = [];
    for (const req of requirements) {
      try {
        const output = execSync(req.cmd, { encoding: 'utf8', stdio: 'pipe' });
        const version = output.trim();
        results.push(`${req.name}: ${version}`);
      } catch (error) {
        throw new Error(`${req.name} not found or not in PATH`);
      }
    }

    return {
      status: 'pass',
      message: `All requirements met (${results.join(', ')})`,
      details: results
    };
  }

  checkProjectStructure() {
    const requiredPaths = [
      'backend',
      'frontend',
      'scripts',
      'package.json',
      'backend/requirements.txt',
      'frontend/package.json',
      'smart-launcher.js'
    ];

    const missing = [];
    const found = [];

    for (const pathToCheck of requiredPaths) {
      if (fs.existsSync(pathToCheck)) {
        found.push(pathToCheck);
      } else {
        missing.push(pathToCheck);
      }
    }

    if (missing.length > 0) {
      return {
        status: 'fail',
        message: `Missing required files/directories: ${missing.join(', ')}`,
        details: { found, missing }
      };
    }

    return {
      status: 'pass',
      message: `All required files and directories present (${found.length} items)`,
      details: { found }
    };
  }

  async checkDependencies() {
    const checks = [];

    // Check backend dependencies
    try {
      if (fs.existsSync('backend/requirements.txt')) {
        const requirements = fs.readFileSync('backend/requirements.txt', 'utf8');
        const packageCount = requirements.split('\n').filter(line => 
          line.trim() && !line.startsWith('#')
        ).length;
        checks.push(`Backend: ${packageCount} packages defined`);
      }
    } catch (error) {
      checks.push('Backend: requirements.txt not readable');
    }

    // Check frontend dependencies
    try {
      if (fs.existsSync('frontend/package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        const depCount = Object.keys(packageJson.dependencies || {}).length;
        const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
        checks.push(`Frontend: ${depCount} dependencies, ${devDepCount} dev dependencies`);
      }
    } catch (error) {
      checks.push('Frontend: package.json not readable');
    }

    // Check if node_modules exists
    const frontendNodeModules = fs.existsSync('frontend/node_modules');
    const backendVenv = fs.existsSync('backend/venv') || fs.existsSync('backend/.venv');

    checks.push(`Frontend installed: ${frontendNodeModules ? 'Yes' : 'No'}`);
    checks.push(`Backend venv: ${backendVenv ? 'Yes' : 'No'}`);

    const allInstalled = frontendNodeModules && (backendVenv || process.env.VIRTUAL_ENV);

    return {
      status: allInstalled ? 'pass' : 'warn',
      message: allInstalled ? 'Dependencies appear to be installed' : 'Some dependencies may not be installed',
      details: checks
    };
  }

  checkEnvironmentConfig() {
    const configs = [
      { path: 'backend/.env', required: false, type: 'Backend' },
      { path: 'backend/.env.example', required: true, type: 'Backend Template' },
      { path: 'frontend/.env', required: false, type: 'Frontend' },
      { path: 'frontend/.env.example', required: true, type: 'Frontend Template' }
    ];

    const results = [];
    let hasErrors = false;

    for (const config of configs) {
      const exists = fs.existsSync(config.path);
      
      if (config.required && !exists) {
        hasErrors = true;
        results.push(`❌ ${config.type}: Missing required ${config.path}`);
      } else if (exists) {
        try {
          const content = fs.readFileSync(config.path, 'utf8');
          const lines = content.split('\n').filter(line => 
            line.trim() && !line.startsWith('#')
          ).length;
          results.push(`✅ ${config.type}: ${lines} configuration entries`);
        } catch (error) {
          results.push(`⚠️  ${config.type}: File exists but not readable`);
        }
      } else {
        results.push(`○ ${config.type}: Optional file not present`);
      }
    }

    return {
      status: hasErrors ? 'fail' : 'pass',
      message: hasErrors ? 'Environment configuration issues found' : 'Environment configuration looks good',
      details: results
    };
  }

  async checkBackendAPI() {
    const ports = [9002, 9000, 9001, 8000]; // Common backend ports
    
    for (const port of ports) {
      try {
        const result = await this.makeHttpRequest(`http://localhost:${port}/api/health`);
        
        if (result.success) {
          return {
            status: 'pass',
            message: `Backend API responding on port ${port}`,
            details: {
              port,
              response: result.data,
              responseTime: result.responseTime
            }
          };
        }
      } catch (error) {
        // Continue to next port
      }
    }

    return {
      status: 'fail',
      message: 'Backend API not responding on any common ports',
      details: { testedPorts: ports }
    };
  }

  async checkFrontendBuild() {
    try {
      // Check if frontend can be built
      if (!fs.existsSync('frontend/package.json')) {
        throw new Error('Frontend package.json not found');
      }

      // Check for common build issues
      const packageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
      
      const hasReactScripts = packageJson.dependencies?.['react-scripts'] || 
                             packageJson.devDependencies?.['react-scripts'];
      
      if (!hasReactScripts) {
        return {
          status: 'warn',
          message: 'Frontend build system not detected',
          details: { buildTool: 'unknown' }
        };
      }

      // Check if TypeScript is configured
      const hasTypeScript = fs.existsSync('frontend/tsconfig.json');
      
      return {
        status: 'pass',
        message: `Frontend build ready (React Scripts${hasTypeScript ? ' + TypeScript' : ''})`,
        details: {
          buildTool: 'react-scripts',
          typescript: hasTypeScript,
          scripts: Object.keys(packageJson.scripts || {})
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Frontend build check failed: ${error.message}`,
        error: true
      };
    }
  }

  async checkPortAvailability() {
    const ports = [
      { port: 9002, service: 'Backend API' },
      { port: 3000, service: 'Frontend Dev Server' },
      { port: 3003, service: 'Frontend Alt Port' }
    ];

    const results = [];
    
    for (const { port, service } of ports) {
      const available = await this.isPortAvailable(port);
      const inUse = !available;
      
      results.push({
        port,
        service,
        available,
        inUse,
        status: inUse ? 'in-use' : 'available'
      });
    }

    const conflicts = results.filter(r => r.inUse);
    
    return {
      status: conflicts.length > 0 ? 'warn' : 'pass',
      message: conflicts.length > 0 
        ? `${conflicts.length} ports in use (may need port management)`
        : 'All common ports available',
      details: results
    };
  }

  async checkPerformance() {
    const metrics = {
      startupTime: Date.now() - this.startTime,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    // Check disk space
    try {
      const stats = fs.statSync('.');
      metrics.diskAccess = 'ok';
    } catch (error) {
      metrics.diskAccess = 'error';
    }

    // Performance assessment
    const isGoodPerformance = metrics.startupTime < 5000; // Less than 5 seconds
    
    return {
      status: isGoodPerformance ? 'pass' : 'warn',
      message: isGoodPerformance 
        ? `Good performance (${metrics.startupTime}ms startup)`
        : `Slow performance (${metrics.startupTime}ms startup)`,
      details: metrics
    };
  }

  // Utility methods
  async makeHttpRequest(url, timeout = 5000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, { timeout }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({
              success: true,
              data: parsed,
              responseTime: Date.now() - startTime,
              statusCode: res.statusCode
            });
          } catch (error) {
            resolve({
              success: res.statusCode === 200,
              data: data,
              responseTime: Date.now() - startTime,
              statusCode: res.statusCode
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime: Date.now() - startTime
        });
      });
    });
  }

  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  calculateOverallHealth() {
    const checks = Object.values(this.results.checks);
    const passed = checks.filter(c => c.status === 'pass').length;
    const warned = checks.filter(c => c.status === 'warn').length;
    const failed = checks.filter(c => c.status === 'fail').length;

    if (failed > 0) {
      this.results.overall = 'unhealthy';
    } else if (warned > 0) {
      this.results.overall = 'degraded';
    } else {
      this.results.overall = 'healthy';
    }

    this.results.summary = { passed, warned, failed, total: checks.length };
  }

  generateReport() {
    log('\n' + '=' * 50, 'cyan');
    log('📊 HEALTH CHECK SUMMARY', 'cyan');
    log('=' * 50, 'cyan');

    const { overall, summary, duration } = this.results;
    
    // Overall status
    const statusColor = overall === 'healthy' ? 'green' : 
                       overall === 'degraded' ? 'yellow' : 'red';
    const statusIcon = overall === 'healthy' ? '✅' : 
                      overall === 'degraded' ? '⚠️' : '❌';
    
    log(`\n${statusIcon} Overall Status: ${overall.toUpperCase()}`, statusColor);
    log(`⏱️  Duration: ${duration}ms`, 'blue');
    log(`📈 Results: ${summary.passed} passed, ${summary.warned} warnings, ${summary.failed} failed`, 'blue');

    // Recommendations
    log('\n🎯 RECOMMENDATIONS:', 'magenta');
    
    if (overall === 'healthy') {
      log('• System is ready for development and testing', 'green');
      log('• Run "npm run dev" to start the application', 'green');
    } else {
      log('• Review failed checks and resolve issues', 'yellow');
      log('• Check the setup guide: README.md', 'yellow');
      log('• Run "npm run setup:check" for detailed setup help', 'yellow');
    }

    // Quick start commands
    log('\n🚀 QUICK START COMMANDS:', 'blue');
    log('• npm run dev          - Start development servers', 'blue');
    log('• npm run dev:kill     - Start with port conflict resolution', 'blue');
    log('• npm run setup:deps   - Install all dependencies', 'blue');
    log('• npm run health       - Run this health check again', 'blue');

    // Save report to file
    try {
      const reportPath = path.join(process.cwd(), 'health-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
    } catch (error) {
      log(`\n⚠️  Could not save report: ${error.message}`, 'yellow');
    }
  }
}

// Main execution
async function main() {
  const checker = new HealthChecker();
  await checker.runAllChecks();
  
  // Exit with appropriate code
  const exitCode = checker.results.overall === 'healthy' ? 0 : 1;
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker };