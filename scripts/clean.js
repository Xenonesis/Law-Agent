#!/usr/bin/env node
/**
 * Cross-platform cleanup script for Private Lawyer Bot
 * Handles cleanup on Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

class Cleaner {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.cleaned = [];
    this.errors = [];
  }

  async clean(target = 'all') {
    log('🧹 Private Lawyer Bot - Cleanup Utility', 'cyan');
    log('=' * 50, 'cyan');

    switch (target) {
      case 'frontend':
        await this.cleanFrontend();
        break;
      case 'backend':
        await this.cleanBackend();
        break;
      case 'cache':
        await this.cleanCache();
        break;
      case 'all':
      default:
        await this.cleanAll();
        break;
    }

    this.displayResults();
  }

  async cleanAll() {
    log('\n🎯 Performing complete cleanup...', 'blue');
    await this.cleanFrontend();
    await this.cleanBackend();
    await this.cleanCache();
    await this.cleanLogs();
    await this.cleanTemp();
  }

  async cleanFrontend() {
    log('\n📱 Cleaning frontend...', 'blue');
    
    const frontendPaths = [
      'frontend/build',
      'frontend/node_modules',
      'frontend/.eslintcache',
      'frontend/coverage'
    ];

    for (const dirPath of frontendPaths) {
      await this.removeDirectory(dirPath);
    }
  }

  async cleanBackend() {
    log('\n🔧 Cleaning backend...', 'blue');
    
    const backendPaths = [
      'backend/__pycache__',
      'backend/.pytest_cache',
      'backend/htmlcov',
      'backend/.coverage',
      'backend/dist',
      'backend/build',
      'backend/*.egg-info'
    ];

    for (const dirPath of backendPaths) {
      if (dirPath.includes('*')) {
        // Handle glob patterns
        await this.removeGlobPattern(dirPath);
      } else {
        await this.removeDirectory(dirPath);
      }
    }

    // Clean Python cache files recursively
    await this.cleanPythonCache('backend');
  }

  async cleanCache() {
    log('\n💾 Cleaning cache...', 'blue');
    
    const cachePaths = [
      'node_modules',
      '.npm',
      '.yarn',
      'package-lock.json',
      'yarn.lock'
    ];

    for (const dirPath of cachePaths) {
      await this.removeDirectory(dirPath);
    }
  }

  async cleanLogs() {
    log('\n📋 Cleaning logs...', 'blue');
    
    const logPaths = [
      'logs',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*'
    ];

    for (const logPath of logPaths) {
      if (logPath.includes('*')) {
        await this.removeGlobPattern(logPath);
      } else {
        await this.removeDirectory(logPath);
      }
    }
  }

  async cleanTemp() {
    log('\n🗂️  Cleaning temporary files...', 'blue');
    
    const tempPaths = [
      '.tmp',
      'tmp',
      '.temp',
      'temp',
      '*.tmp',
      '.DS_Store',
      'Thumbs.db'
    ];

    for (const tempPath of tempPaths) {
      if (tempPath.includes('*') || tempPath.startsWith('.')) {
        await this.removeGlobPattern(tempPath);
      } else {
        await this.removeDirectory(tempPath);
      }
    }
  }

  async removeDirectory(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        
        if (stats.isDirectory()) {
          await this.removeDirectoryRecursive(dirPath);
          log(`  ✓ Removed directory: ${dirPath}`, 'green');
          this.cleaned.push(dirPath);
        } else {
          fs.unlinkSync(dirPath);
          log(`  ✓ Removed file: ${dirPath}`, 'green');
          this.cleaned.push(dirPath);
        }
      }
    } catch (error) {
      log(`  ❌ Failed to remove ${dirPath}: ${error.message}`, 'red');
      this.errors.push({ path: dirPath, error: error.message });
    }
  }

  async removeDirectoryRecursive(dirPath) {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          await this.removeDirectoryRecursive(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
      
      fs.rmdirSync(dirPath);
    }
  }

  async removeGlobPattern(pattern) {
    try {
      const baseDir = pattern.includes('/') ? path.dirname(pattern) : '.';
      const fileName = path.basename(pattern);
      
      if (!fs.existsSync(baseDir)) return;
      
      const files = fs.readdirSync(baseDir);
      const matchingFiles = files.filter(file => {
        if (fileName.includes('*')) {
          const regex = new RegExp(fileName.replace(/\*/g, '.*'));
          return regex.test(file);
        }
        return file === fileName;
      });

      for (const file of matchingFiles) {
        const fullPath = path.join(baseDir, file);
        await this.removeDirectory(fullPath);
      }
    } catch (error) {
      log(`  ❌ Failed to process pattern ${pattern}: ${error.message}`, 'red');
      this.errors.push({ path: pattern, error: error.message });
    }
  }

  async cleanPythonCache(directory) {
    try {
      if (!fs.existsSync(directory)) return;
      
      const items = fs.readdirSync(directory);
      
      for (const item of items) {
        const itemPath = path.join(directory, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          if (item === '__pycache__') {
            await this.removeDirectoryRecursive(itemPath);
            log(`  ✓ Removed Python cache: ${itemPath}`, 'green');
            this.cleaned.push(itemPath);
          } else {
            // Recursively clean subdirectories
            await this.cleanPythonCache(itemPath);
          }
        } else if (item.endsWith('.pyc') || item.endsWith('.pyo')) {
          fs.unlinkSync(itemPath);
          log(`  ✓ Removed Python cache file: ${itemPath}`, 'green');
          this.cleaned.push(itemPath);
        }
      }
    } catch (error) {
      log(`  ❌ Failed to clean Python cache in ${directory}: ${error.message}`, 'red');
      this.errors.push({ path: directory, error: error.message });
    }
  }

  displayResults() {
    log('\n' + '=' * 50, 'cyan');
    log('🧹 CLEANUP SUMMARY', 'cyan');
    log('=' * 50, 'cyan');

    log(`\n✅ Successfully cleaned: ${this.cleaned.length} items`, 'green');
    if (this.cleaned.length > 0) {
      this.cleaned.forEach(item => log(`   • ${item}`, 'green'));
    }

    if (this.errors.length > 0) {
      log(`\n❌ Errors encountered: ${this.errors.length}`, 'red');
      this.errors.forEach(error => log(`   • ${error.path}: ${error.error}`, 'red'));
    }

    // Calculate freed space (approximate)
    log('\n💾 Cleanup completed!', 'cyan');
    log('   • Build artifacts removed', 'blue');
    log('   • Cache files cleared', 'blue');
    log('   • Temporary files deleted', 'blue');
    log('   • Python cache cleaned', 'blue');

    log('\n🚀 Next steps:', 'yellow');
    log('   • Run "npm install" to reinstall dependencies', 'yellow');
    log('   • Run "cd frontend && npm install" for frontend deps', 'yellow');
    log('   • Run "npm run setup:deps" for complete setup', 'yellow');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';
  
  const validTargets = ['all', 'frontend', 'backend', 'cache'];
  
  if (!validTargets.includes(target)) {
    log('❌ Invalid target. Valid options: all, frontend, backend, cache', 'red');
    process.exit(1);
  }

  const cleaner = new Cleaner();
  
  try {
    await cleaner.clean(target);
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = Cleaner;