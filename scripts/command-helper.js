#!/usr/bin/env node
/**
 * Interactive Command Helper for Private Lawyer Bot
 * Shows all available commands when user presses "/"
 */

const readline = require('readline');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

class CommandHelper {
  constructor() {
    this.commands = this.loadCommands();
    this.rl = null;
    this.isRunning = false;
  }

  loadCommands() {
    // Load commands from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const npmScripts = packageJson.scripts || {};

    return {
      // Development Commands
      development: [
        {
          command: 'npm run dev',
          description: 'Start both frontend and backend servers',
          category: 'dev',
          shortcut: 'dev',
          icon: '🚀'
        },
        {
          command: 'npm run dev:kill',
          description: 'Start servers with automatic port conflict resolution',
          category: 'dev',
          shortcut: 'devk',
          icon: '⚡'
        },
        {
          command: 'npm run dev:backend',
          description: 'Start only the backend server',
          category: 'dev',
          shortcut: 'back',
          icon: '🔧'
        },
        {
          command: 'npm run dev:frontend',
          description: 'Start only the frontend server',
          category: 'dev',
          shortcut: 'front',
          icon: '🌐'
        }
      ],

      // Setup Commands
      setup: [
        {
          command: 'npm run setup:check',
          description: 'Verify project setup and configuration',
          category: 'setup',
          shortcut: 'check',
          icon: '🔍'
        },
        {
          command: 'npm run setup:deps',
          description: 'Install all dependencies (frontend + backend)',
          category: 'setup',
          shortcut: 'deps',
          icon: '📦'
        },
        {
          command: 'npm run setup:env',
          description: 'Setup environment configuration files',
          category: 'setup',
          shortcut: 'env',
          icon: '⚙️'
        },
        {
          command: 'node scripts/setup-api-keys.js',
          description: 'Configure AI provider API keys',
          category: 'setup',
          shortcut: 'keys',
          icon: '🔑'
        }
      ],

      // Health & Diagnostics
      health: [
        {
          command: 'npm run health',
          description: 'Run comprehensive system health check',
          category: 'health',
          shortcut: 'health',
          icon: '🏥'
        },
        {
          command: 'node scripts/port-status.js',
          description: 'Check port usage and conflicts',
          category: 'health',
          shortcut: 'ports',
          icon: '🔌'
        },
        {
          command: 'npm run deploy:check',
          description: 'Check deployment readiness',
          category: 'health',
          shortcut: 'deploy',
          icon: '🚀'
        }
      ],

      // Build & Test
      build: [
        {
          command: 'npm run build',
          description: 'Build both frontend and backend for production',
          category: 'build',
          shortcut: 'build',
          icon: '🏗️'
        },
        {
          command: 'npm run test',
          description: 'Run all tests (frontend + backend)',
          category: 'build',
          shortcut: 'test',
          icon: '🧪'
        },
        {
          command: 'npm run lint',
          description: 'Run code linting for all components',
          category: 'build',
          shortcut: 'lint',
          icon: '🔍'
        },
        {
          command: 'npm run format',
          description: 'Format code using prettier/black',
          category: 'build',
          shortcut: 'format',
          icon: '✨'
        }
      ],

      // Maintenance
      maintenance: [
        {
          command: 'npm run clean',
          description: 'Clean all build artifacts and cache',
          category: 'maintenance',
          shortcut: 'clean',
          icon: '🧹'
        },
        {
          command: 'npm run security:audit',
          description: 'Run security audit on dependencies',
          category: 'maintenance',
          shortcut: 'audit',
          icon: '🔒'
        },
        {
          command: 'npm run update:deps',
          description: 'Check for dependency updates',
          category: 'maintenance',
          shortcut: 'update',
          icon: '⬆️'
        }
      ],

      // Quick Actions
      quick: [
        {
          command: 'clear',
          description: 'Clear terminal screen',
          category: 'quick',
          shortcut: 'cls',
          icon: '🧽'
        },
        {
          command: 'exit',
          description: 'Exit command helper',
          category: 'quick',
          shortcut: 'exit',
          icon: '👋'
        },
        {
          command: 'help',
          description: 'Show this help menu',
          category: 'quick',
          shortcut: 'help',
          icon: '❓'
        }
      ]
    };
  }

  displayWelcome() {
    console.clear();
    console.log(colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan'));
    console.log(colorize('║                🏛️  PRIVATE LAWYER BOT COMMANDS                ║', 'cyan'));
    console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan'));
    console.log();
    console.log(colorize('💡 Type "/" to show commands, or use shortcuts directly', 'yellow'));
    console.log(colorize('💡 Type "help" for detailed help, "exit" to quit', 'yellow'));
    console.log();
  }

  displayCommands() {
    console.log(colorize('\n📋 Available Commands:', 'bright'));
    console.log(colorize('═'.repeat(60), 'gray'));

    const categories = [
      { key: 'development', title: '🚀 Development', color: 'green' },
      { key: 'setup', title: '⚙️  Setup & Configuration', color: 'blue' },
      { key: 'health', title: '🏥 Health & Diagnostics', color: 'magenta' },
      { key: 'build', title: '🏗️  Build & Test', color: 'yellow' },
      { key: 'maintenance', title: '🧹 Maintenance', color: 'cyan' },
      { key: 'quick', title: '⚡ Quick Actions', color: 'gray' }
    ];

    categories.forEach(category => {
      console.log(`\n${colorize(category.title, category.color)}`);
      console.log(colorize('─'.repeat(40), 'gray'));
      
      this.commands[category.key].forEach((cmd, index) => {
        const shortcut = colorize(`[${cmd.shortcut}]`, 'yellow');
        const icon = cmd.icon;
        const description = colorize(cmd.description, 'reset');
        
        console.log(`  ${icon} ${shortcut.padEnd(15)} ${description}`);
      });
    });

    console.log(colorize('\n─'.repeat(60), 'gray'));
    console.log(colorize('💡 Usage: Type shortcut (e.g., "dev") or full command', 'yellow'));
    console.log();
  }

  findCommand(input) {
    const normalizedInput = input.toLowerCase().trim();
    
    // Check all categories for matching shortcuts or commands
    for (const category of Object.values(this.commands)) {
      for (const cmd of category) {
        if (cmd.shortcut === normalizedInput || 
            cmd.command.toLowerCase().includes(normalizedInput)) {
          return cmd;
        }
      }
    }
    
    return null;
  }

  async executeCommand(commandStr) {
    const command = this.findCommand(commandStr);
    
    if (!command) {
      // Handle special cases
      switch (commandStr.toLowerCase()) {
        case '/':
          this.displayCommands();
          return;
        case 'help':
          this.displayHelp();
          return;
        case 'clear':
        case 'cls':
          console.clear();
          this.displayWelcome();
          return;
        case 'exit':
        case 'quit':
          this.stop();
          return;
        default:
          console.log(colorize(`❌ Unknown command: "${commandStr}"`, 'red'));
          console.log(colorize('💡 Type "/" to see available commands', 'yellow'));
          return;
      }
    }

    console.log(colorize(`\n🔄 Executing: ${command.command}`, 'blue'));
    console.log(colorize('─'.repeat(50), 'gray'));

    try {
      // Handle special commands
      if (command.command === 'exit') {
        this.stop();
        return;
      }

      if (command.command === 'clear') {
        console.clear();
        this.displayWelcome();
        return;
      }

      // Execute the actual command
      const child = spawn(command.command, [], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(colorize(`\n✅ Command completed successfully`, 'green'));
        } else {
          console.log(colorize(`\n❌ Command failed with exit code ${code}`, 'red'));
        }
        console.log(colorize('─'.repeat(50), 'gray'));
        this.prompt();
      });

      child.on('error', (error) => {
        console.log(colorize(`\n❌ Error executing command: ${error.message}`, 'red'));
        console.log(colorize('─'.repeat(50), 'gray'));
        this.prompt();
      });

    } catch (error) {
      console.log(colorize(`❌ Error: ${error.message}`, 'red'));
      this.prompt();
    }
  }

  displayHelp() {
    console.log(colorize('\n📖 Command Helper Guide:', 'bright'));
    console.log(colorize('═'.repeat(50), 'gray'));
    console.log();
    console.log(colorize('🎯 How to use:', 'cyan'));
    console.log('  • Type "/" to show all available commands');
    console.log('  • Use shortcuts (e.g., "dev", "health", "build")');
    console.log('  • Type full commands (e.g., "npm run dev")');
    console.log('  • Use "clear" to clear screen, "exit" to quit');
    console.log();
    console.log(colorize('🔥 Most Used Commands:', 'yellow'));
    console.log('  • dev     - Start development servers');
    console.log('  • health  - Check system health');
    console.log('  • check   - Verify project setup');
    console.log('  • clean   - Clean build artifacts');
    console.log();
    console.log(colorize('💡 Pro Tips:', 'green'));
    console.log('  • Commands run in the current directory');
    console.log('  • Use Ctrl+C to stop running commands');
    console.log('  • Check README.md for detailed documentation');
    console.log();
  }

  prompt() {
    if (!this.isRunning) return;
    
    this.rl.question(colorize('🤖 lawyer-bot> ', 'cyan'), (input) => {
      if (!input.trim()) {
        this.prompt();
        return;
      }

      this.executeCommand(input.trim());
    });
  }

  start() {
    this.isRunning = true;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: colorize('🤖 lawyer-bot> ', 'cyan')
    });

    this.displayWelcome();
    
    // Show commands immediately on start
    this.displayCommands();
    
    this.prompt();

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      console.log(colorize('\n\n👋 Goodbye!', 'yellow'));
      this.stop();
    });
  }

  stop() {
    this.isRunning = false;
    if (this.rl) {
      this.rl.close();
    }
    console.log(colorize('\n✨ Command helper closed. Happy coding!', 'green'));
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const helper = new CommandHelper();
  helper.start();
}

module.exports = CommandHelper;