#!/usr/bin/env node
/**
 * Post-installation setup checker
 * Verifies project setup and provides guidance
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description, required = true) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : (required ? '✗' : '○');
  const color = exists ? 'green' : (required ? 'red' : 'yellow');
  
  log(`${status} ${description}`, color);
  return exists;
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? '✓' : '✗';
  const color = exists ? 'green' : 'red';
  
  log(`${status} ${description}`, color);
  return exists;
}

function checkEnvironmentFiles() {
  log('\n📁 Environment Configuration:', 'cyan');
  
  const backendEnvExists = checkFile('backend/.env', 'Backend environment file', false);
  const frontendEnvExists = checkFile('frontend/.env', 'Frontend environment file', false);
  
  checkFile('backend/.env.example', 'Backend environment template');
  checkFile('frontend/.env.example', 'Frontend environment template');
  
  if (!backendEnvExists || !frontendEnvExists) {
    log('\n💡 Tip: Copy .env.example files to .env and configure your API keys', 'yellow');
    log('   Backend: cp backend/.env.example backend/.env', 'yellow');
    log('   Frontend: cp frontend/.env.example frontend/.env', 'yellow');
  }
  
  return backendEnvExists && frontendEnvExists;
}

function checkDependencies() {
  log('\n📦 Dependencies:', 'cyan');
  
  // Check backend dependencies
  const backendDepsExist = checkDirectory('backend/venv', 'Backend virtual environment') ||
                          checkFile('backend/requirements.txt', 'Backend requirements file');
  
  // Check frontend dependencies
  const frontendDepsExist = checkDirectory('frontend/node_modules', 'Frontend dependencies');
  
  return backendDepsExist && frontendDepsExist;
}

function checkProjectStructure() {
  log('\n🏗️  Project Structure:', 'cyan');
  
  const checks = [
    () => checkDirectory('backend', 'Backend directory'),
    () => checkDirectory('frontend', 'Frontend directory'),
    () => checkDirectory('scripts', 'Scripts directory'),
    () => checkFile('backend/fixed_server.py', 'Backend server file'),
    () => checkFile('frontend/package.json', 'Frontend package.json'),
    () => checkFile('smart-launcher.js', 'Smart launcher script')
  ];
  
  return checks.every(check => check());
}

function checkOptionalFeatures() {
  log('\n🔧 Optional Features:', 'cyan');
  
  checkFile('backend/nlp_requirements.txt', 'NLP requirements (for advanced features)', false);
  checkFile('.gitignore', 'Git ignore file', false);
  checkFile('README.md', 'Documentation', false);
  checkFile('SETUP-NLP-GUIDE.md', 'NLP setup guide', false);
}

function generateSetupReport() {
  log('\n📋 Setup Report:', 'magenta');
  log('=' * 50, 'magenta');
  
  const envConfigured = checkEnvironmentFiles();
  const depsInstalled = checkDependencies();
  const structureValid = checkProjectStructure();
  
  checkOptionalFeatures();
  
  log('\n🎯 Next Steps:', 'blue');
  
  if (!envConfigured) {
    log('1. Configure environment files (.env)', 'yellow');
    log('   • Add your API keys for OpenAI, Gemini, or Mistral', 'yellow');
    log('   • Set up database configuration if needed', 'yellow');
  }
  
  if (!depsInstalled) {
    log('2. Install dependencies:', 'yellow');
    log('   • Backend: cd backend && pip install -r requirements.txt', 'yellow');
    log('   • Frontend: cd frontend && npm install', 'yellow');
  }
  
  log('3. Start the application:', 'green');
  log('   • Quick start: npm run dev', 'green');
  log('   • Smart start: npm run dev:kill (handles port conflicts)', 'green');
  log('   • Backend only: npm run dev:backend', 'green');
  
  log('\n🔗 Useful Commands:', 'blue');
  log('   • npm run health - Check system health', 'blue');
  log('   • npm run port:status - Check port usage', 'blue');
  log('   • npm run setup:nlp - Install NLP features', 'blue');
  log('   • npm run clean - Clean build artifacts', 'blue');
  
  const overallStatus = envConfigured && depsInstalled && structureValid;
  
  log('\n' + '=' * 50, 'magenta');
  log(`Setup Status: ${overallStatus ? 'READY' : 'NEEDS ATTENTION'}`, 
      overallStatus ? 'green' : 'yellow');
  
  if (overallStatus) {
    log('🚀 Your Private Lawyer Bot is ready to launch!', 'green');
    log('Run "npm run dev" to start the application.', 'green');
  } else {
    log('⚠️  Please complete the setup steps above.', 'yellow');
  }
}

function main() {
  log('🔍 Private Lawyer Bot - Setup Verification', 'cyan');
  log('=' * 50, 'cyan');
  
  generateSetupReport();
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, checkDirectory };