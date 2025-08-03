#!/usr/bin/env node
/**
 * Enhanced Terminal Launcher for Private Lawyer Bot
 * Automatically shows command helper when user presses "/"
 */

const readline = require('readline');
const { spawn } = require('child_process');
const CommandHelper = require('./scripts/command-helper.js');

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

class TerminalLauncher {
  constructor() {
    this.rl = null;
    this.commandHelper = new CommandHelper();
    this.isRunning = false;
  }

  displayWelcome() {
    console.clear();
    console.log(colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan'));
    console.log(colorize('║            🏛️  PRIVATE LAWYER BOT TERMINAL                    ║', 'cyan'));
    console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan'));
    console.log();
    console.log(colorize('🚀 Enhanced Terminal with Smart Command Helper', 'green'));
    console.log();
    console.log(colorize('💡 Quick Tips:', 'yellow'));
    console.log(colorize('   • Type "/" to show all available commands', 'yellow'));
    console.log(colorize('   • Use shortcuts like "dev", "health", "build"', 'yellow'));
    console.log(colorize('   • Type "help" for detailed help', 'yellow'));
    console.log(colorize('   • Type "exit" to quit', 'yellow'));
    console.log();
    console.log(colorize('🔥 Most Used Commands:', 'blue'));
    console.log(colorize('   dev     - Start development servers', 'blue'));
    console.log(colorize('   health  - Check system health', 'blue'));
    console.log(colorize('   check   - Verify project setup', 'blue'));
    console.log(colorize('   clean   - Clean build artifacts', 'blue'));
    console.log();
    console.log(colorize('─'.repeat(60), 'gray'));
  }

  async executeCommand(input) {
    const trimmedInput = input.trim();
    
    // Handle special cases
    if (trimmedInput === '/') {
      this.showCommands();
      return;
    }
    
    if (trimmedInput === 'help') {
      this.showHelp();
      return;
    }
    
    if (trimmedInput === 'clear' || trimmedInput === 'cls') {
      console.clear();
      this.displayWelcome();
      return;
    }
    
    if (trimmedInput === 'exit' || trimmedInput === 'quit') {
      this.stop();
      return;
    }

    // Check if it's a known shortcut
    const command = this.commandHelper.findCommand(trimmedInput);
    
    if (command) {
      console.log(colorize(`\n🔄 Executing: ${command.command}`, 'blue'));
      console.log(colorize('─'.repeat(50), 'gray'));
      
      try {
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
    } else {
      // Try to execute as a regular shell command
      console.log(colorize(`\n🔄 Executing shell command: ${trimmedInput}`, 'blue'));
      console.log(colorize('─'.repeat(50), 'gray'));
      
      const child = spawn(trimmedInput, [], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(colorize(`\n✅ Command completed`, 'green'));
        } else {
          console.log(colorize(`\n❌ Command failed with exit code ${code}`, 'red'));
        }
        console.log(colorize('─'.repeat(50), 'gray'));
        this.prompt();
      });

      child.on('error', (error) => {
        console.log(colorize(`\n❌ Command not found: ${trimmedInput}`, 'red'));
        console.log(colorize('💡 Type "/" to see available commands', 'yellow'));
        console.log(colorize('─'.repeat(50), 'gray'));
        this.prompt();
      });
    }
  }

  showCommands() {
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
      
      this.commandHelper.commands[category.key].forEach((cmd, index) => {
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

  showHelp() {
    console.log(colorize('\n📖 Terminal Helper Guide:', 'bright'));
    console.log(colorize('═'.repeat(50), 'gray'));
    console.log();
    console.log(colorize('🎯 How to use this terminal:', 'cyan'));
    console.log('  • Type "/" to show all available commands');
    console.log('  • Use shortcuts (e.g., "dev", "health", "build")');
    console.log('  • Type full commands (e.g., "npm run dev")');
    console.log('  • Execute any shell command directly');
    console.log('  • Use "clear" to clear screen, "exit" to quit');
    console.log();
    console.log(colorize('🔥 Most Used Commands:', 'yellow'));
    console.log('  • dev     - Start development servers');
    console.log('  • health  - Check system health');
    console.log('  • check   - Verify project setup');
    console.log('  • clean   - Clean build artifacts');
    console.log('  • ports   - Check port status');
    console.log();
    console.log(colorize('💡 Pro Tips:', 'green'));
    console.log('  • Commands run in the current directory');
    console.log('  • Use Ctrl+C to stop running commands');
    console.log('  • Check README.md for detailed documentation');
    console.log('  • All npm scripts are available as shortcuts');
    console.log();
  }

  prompt() {
    if (!this.isRunning) return;
    
    this.rl.question(colorize('🤖 lawyer-bot> ', 'cyan'), (input) => {
      if (!input.trim()) {
        this.prompt();
        return;
      }

      this.executeCommand(input);
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
    this.prompt();

    // Handle Ctrl+C gracefully
    this.rl.on('SIGINT', () => {
      console.log(colorize('\n\n👋 Goodbye!', 'yellow'));
      this.stop();
    });

    // Handle close event
    this.rl.on('close', () => {
      this.stop();
    });
  }

  stop() {
    this.isRunning = false;
    if (this.rl) {
      this.rl.close();
    }
    console.log(colorize('\n✨ Terminal closed. Happy coding!', 'green'));
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const launcher = new TerminalLauncher();
  launcher.start();
}

module.exports = TerminalLauncher;