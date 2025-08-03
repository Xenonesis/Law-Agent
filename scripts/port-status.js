#!/usr/bin/env node
/**
 * Port Status Checker for Private Lawyer Bot
 * Shows which ports are in use and by what processes
 */

const { exec } = require('child_process');
const net = require('net');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

class PortChecker {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.commonPorts = [
      { port: 3000, service: 'Frontend Dev Server (React)' },
      { port: 3001, service: 'Frontend Alt Port' },
      { port: 3003, service: 'Frontend Alt Port 2' },
      { port: 8000, service: 'Backend Alt Port' },
      { port: 8080, service: 'HTTP Alt Port' },
      { port: 9000, service: 'Backend Alt Port' },
      { port: 9001, service: 'Backend Alt Port' },
      { port: 9002, service: 'Backend API (Default)' },
      { port: 5000, service: 'Flask/Python Dev Server' },
      { port: 5173, service: 'Vite Dev Server' },
      { port: 4000, service: 'Node.js Alt Port' }
    ];
  }

  async checkPortAvailability(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  async getProcessOnPort(port) {
    return new Promise((resolve) => {
      const command = this.isWindows 
        ? `netstat -ano | findstr :${port}`
        : `lsof -ti:${port} -sTCP:LISTEN`;
      
      exec(command, (error, stdout, stderr) => {
        if (error || !stdout.trim()) {
          resolve(null);
          return;
        }

        try {
          if (this.isWindows) {
            const lines = stdout.trim().split('\n');
            const tcpLine = lines.find(line => 
              line.includes('LISTENING') || line.includes(':' + port)
            );
            
            if (tcpLine) {
              const parts = tcpLine.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              resolve({ pid: parseInt(pid) });
            } else {
              resolve(null);
            }
          } else {
            const pid = parseInt(stdout.trim().split('\n')[0]);
            if (!isNaN(pid)) {
              resolve({ pid });
            } else {
              resolve(null);
            }
          }
        } catch (parseError) {
          resolve(null);
        }
      });
    });
  }

  async getProcessName(pid) {
    return new Promise((resolve) => {
      const command = this.isWindows 
        ? `tasklist /FI "PID eq ${pid}" /FO CSV /NH`
        : `ps -p ${pid} -o comm=`;
      
      exec(command, (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve('Unknown');
          return;
        }

        try {
          if (this.isWindows) {
            const csvLine = stdout.trim().split('\n')[0];
            const processName = csvLine.split(',')[0].replace(/"/g, '');
            resolve(processName);
          } else {
            resolve(stdout.trim());
          }
        } catch (parseError) {
          resolve('Unknown');
        }
      });
    });
  }

  async killProcess(pid) {
    return new Promise((resolve) => {
      const command = this.isWindows 
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;
      
      exec(command, (error) => {
        resolve(!error);
      });
    });
  }

  async checkAllPorts() {
    console.log(colorize('🔌 Port Status Check for Private Lawyer Bot', 'cyan'));
    console.log(colorize('═'.repeat(60), 'cyan'));
    console.log();

    const results = [];
    
    for (const portInfo of this.commonPorts) {
      const available = await this.checkPortAvailability(portInfo.port);
      const processInfo = available ? null : await this.getProcessOnPort(portInfo.port);
      const processName = processInfo ? await this.getProcessName(processInfo.pid) : null;
      
      results.push({
        ...portInfo,
        available,
        processInfo,
        processName
      });
    }

    // Display results
    console.log(colorize('📊 Port Status Summary:', 'blue'));
    console.log(colorize('─'.repeat(60), 'gray'));
    
    const availablePorts = results.filter(r => r.available);
    const usedPorts = results.filter(r => !r.available);
    
    console.log(`${colorize('✅ Available:', 'green')} ${availablePorts.length} ports`);
    console.log(`${colorize('🔴 In Use:', 'red')} ${usedPorts.length} ports`);
    console.log();

    if (usedPorts.length > 0) {
      console.log(colorize('🔴 Ports Currently In Use:', 'red'));
      console.log(colorize('─'.repeat(40), 'gray'));
      
      usedPorts.forEach(port => {
        const pidInfo = port.processInfo ? `PID: ${port.processInfo.pid}` : 'Unknown PID';
        const processInfo = port.processName ? `(${port.processName})` : '';
        
        console.log(`  ${colorize(port.port.toString().padEnd(6), 'yellow')} ${port.service}`);
        console.log(`         ${colorize(pidInfo, 'gray')} ${colorize(processInfo, 'gray')}`);
      });
      console.log();
    }

    if (availablePorts.length > 0) {
      console.log(colorize('✅ Available Ports:', 'green'));
      console.log(colorize('─'.repeat(40), 'gray'));
      
      availablePorts.forEach(port => {
        console.log(`  ${colorize(port.port.toString().padEnd(6), 'green')} ${port.service}`);
      });
      console.log();
    }

    // Recommendations
    this.displayRecommendations(results);
    
    return results;
  }

  displayRecommendations(results) {
    console.log(colorize('💡 Recommendations:', 'yellow'));
    console.log(colorize('─'.repeat(30), 'gray'));
    
    const backendPort = results.find(r => r.port === 9002);
    const frontendPort = results.find(r => r.port === 3000);
    
    if (!backendPort.available) {
      console.log(`  ${colorize('🔧 Backend (9002):', 'red')} Port in use`);
      console.log(`     • Kill process: ${this.isWindows ? 'taskkill /F /PID' : 'kill -9'} ${backendPort.processInfo?.pid}`);
      console.log(`     • Or use: npm run dev:kill (auto-resolves conflicts)`);
    } else {
      console.log(`  ${colorize('🔧 Backend (9002):', 'green')} Ready to use`);
    }
    
    if (!frontendPort.available) {
      console.log(`  ${colorize('🌐 Frontend (3000):', 'red')} Port in use`);
      console.log(`     • Kill process: ${this.isWindows ? 'taskkill /F /PID' : 'kill -9'} ${frontendPort.processInfo?.pid}`);
      console.log(`     • Or use: npm run dev:kill (auto-resolves conflicts)`);
    } else {
      console.log(`  ${colorize('🌐 Frontend (3000):', 'green')} Ready to use`);
    }
    
    console.log();
    console.log(colorize('🚀 Quick Actions:', 'blue'));
    console.log('  • npm run dev        - Start with interactive conflict resolution');
    console.log('  • npm run dev:kill   - Start with automatic conflict resolution');
    console.log('  • npm run health     - Full system health check');
    console.log();
  }

  async interactivePortManager() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const results = await this.checkAllPorts();
    const usedPorts = results.filter(r => !r.available);
    
    if (usedPorts.length === 0) {
      console.log(colorize('🎉 All ports are available! Ready to start development.', 'green'));
      rl.close();
      return;
    }

    console.log(colorize('🔧 Port Management Options:', 'yellow'));
    console.log('1. Kill all conflicting processes');
    console.log('2. Kill specific processes');
    console.log('3. Show detailed process information');
    console.log('4. Exit without changes');
    
    rl.question('\nChoose an option (1-4): ', async (choice) => {
      switch (choice.trim()) {
        case '1':
          await this.killAllConflicts(usedPorts);
          break;
        case '2':
          await this.killSpecificProcesses(usedPorts, rl);
          break;
        case '3':
          await this.showDetailedInfo(usedPorts);
          break;
        case '4':
        default:
          console.log(colorize('👋 Exiting without changes.', 'yellow'));
          break;
      }
      rl.close();
    });
  }

  async killAllConflicts(usedPorts) {
    console.log(colorize('\n🔄 Killing all conflicting processes...', 'yellow'));
    
    for (const port of usedPorts) {
      if (port.processInfo) {
        const success = await this.killProcess(port.processInfo.pid);
        if (success) {
          console.log(colorize(`✅ Killed process ${port.processInfo.pid} on port ${port.port}`, 'green'));
        } else {
          console.log(colorize(`❌ Failed to kill process ${port.processInfo.pid} on port ${port.port}`, 'red'));
        }
      }
    }
    
    console.log(colorize('\n🎉 Port cleanup completed!', 'green'));
  }

  async killSpecificProcesses(usedPorts, rl) {
    console.log(colorize('\n🎯 Select processes to kill:', 'yellow'));
    
    usedPorts.forEach((port, index) => {
      console.log(`${index + 1}. Port ${port.port} - ${port.processName} (PID: ${port.processInfo?.pid})`);
    });
    
    rl.question('\nEnter numbers separated by commas (e.g., 1,3): ', async (selection) => {
      const indices = selection.split(',').map(s => parseInt(s.trim()) - 1);
      
      for (const index of indices) {
        if (index >= 0 && index < usedPorts.length) {
          const port = usedPorts[index];
          if (port.processInfo) {
            const success = await this.killProcess(port.processInfo.pid);
            if (success) {
              console.log(colorize(`✅ Killed process on port ${port.port}`, 'green'));
            } else {
              console.log(colorize(`❌ Failed to kill process on port ${port.port}`, 'red'));
            }
          }
        }
      }
    });
  }

  async showDetailedInfo(usedPorts) {
    console.log(colorize('\n📋 Detailed Process Information:', 'blue'));
    console.log(colorize('─'.repeat(50), 'gray'));
    
    for (const port of usedPorts) {
      console.log(`\n${colorize(`Port ${port.port}:`, 'yellow')} ${port.service}`);
      console.log(`  Process: ${port.processName || 'Unknown'}`);
      console.log(`  PID: ${port.processInfo?.pid || 'Unknown'}`);
      console.log(`  Kill command: ${this.isWindows ? 'taskkill /F /PID' : 'kill -9'} ${port.processInfo?.pid}`);
    }
    console.log();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive') || args.includes('-i');
  
  const checker = new PortChecker();
  
  if (interactive) {
    await checker.interactivePortManager();
  } else {
    await checker.checkAllPorts();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  });
}

module.exports = PortChecker;