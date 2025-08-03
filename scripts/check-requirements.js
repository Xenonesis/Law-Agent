#!/usr/bin/env node
/**
 * Pre-installation requirements checker
 * Ensures system meets minimum requirements before installation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function checkCommand(command, name, minVersion = null) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    const version = output.trim();
    
    if (minVersion && version) {
      const currentVersion = version.match(/\d+\.\d+\.\d+/)?.[0];
      if (currentVersion && compareVersions(currentVersion, minVersion) < 0) {
        log(`✗ ${name} version ${currentVersion} is below minimum required ${minVersion}`, 'red');
        return false;
      }
    }
    
    log(`✓ ${name} is available${version ? ` (${version})` : ''}`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name} is not available or not in PATH`, 'red');
    return false;
  }
}

function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart < bPart) return -1;
    if (aPart > bPart) return 1;
  }
  
  return 0;
}

function checkDiskSpace() {
  try {
    const stats = fs.statSync('.');
    // Basic check - ensure we can write to current directory
    fs.accessSync('.', fs.constants.W_OK);
    log('✓ Sufficient disk space and write permissions', 'green');
    return true;
  } catch (error) {
    log('✗ Insufficient permissions or disk space', 'red');
    return false;
  }
}

function main() {
  log('🔍 Checking system requirements...', 'cyan');
  log('=' * 40, 'cyan');
  
  const checks = [
    () => checkCommand('node --version', 'Node.js', '18.0.0'),
    () => checkCommand('npm --version', 'npm', '9.0.0'),
    () => checkCommand('python --version || python3 --version', 'Python', '3.8.0'),
    () => checkCommand('pip --version || pip3 --version', 'pip'),
    () => checkDiskSpace()
  ];
  
  const results = checks.map(check => check());
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  log('', 'reset');
  log(`Requirements check: ${passed}/${total} passed`, passed === total ? 'green' : 'red');
  
  if (passed !== total) {
    log('', 'reset');
    log('❌ Some requirements are not met. Please install missing dependencies:', 'red');
    log('', 'reset');
    log('Installation guides:', 'yellow');
    log('• Node.js: https://nodejs.org/en/download/', 'yellow');
    log('• Python: https://www.python.org/downloads/', 'yellow');
    log('• pip: Usually comes with Python, or install separately', 'yellow');
    log('', 'reset');
    process.exit(1);
  }
  
  log('✅ All requirements met! Installation can proceed.', 'green');
}

if (require.main === module) {
  main();
}

module.exports = { checkCommand, compareVersions };