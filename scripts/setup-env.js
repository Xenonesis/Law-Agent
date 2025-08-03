#!/usr/bin/env node
/**
 * Environment setup script for Private Lawyer Bot
 * Creates and configures environment files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

class EnvironmentSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async setup() {
    log('⚙️  Private Lawyer Bot - Environment Setup', 'cyan');
    log('=' * 50, 'cyan');
    log('This will help you configure your environment files.\n', 'blue');

    try {
      await this.setupBackendEnvironment();
      await this.setupFrontendEnvironment();
      await this.displaySummary();
    } finally {
      this.rl.close();
    }
  }

  async setupBackendEnvironment() {
    log('🔧 Setting up backend environment...', 'blue');
    
    const backendEnvPath = 'backend/.env';
    const backendEnvExamplePath = 'backend/.env.example';
    
    // Check if .env already exists
    if (fs.existsSync(backendEnvPath)) {
      const overwrite = await this.askYesNo(
        'Backend .env file already exists. Overwrite?', 
        false
      );
      
      if (!overwrite) {
        log('  ○ Skipping backend environment setup', 'yellow');
        return;
      }
    }

    // Copy from example if it exists
    if (fs.existsSync(backendEnvExamplePath)) {
      fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
      log('  ✓ Created backend/.env from template', 'green');
    } else {
      // Create basic .env file
      const basicEnv = this.createBasicBackendEnv();
      fs.writeFileSync(backendEnvPath, basicEnv);
      log('  ✓ Created basic backend/.env file', 'green');
    }

    // Configure API keys
    const configureKeys = await this.askYesNo(
      'Would you like to configure AI provider API keys now?', 
      true
    );

    if (configureKeys) {
      await this.configureAPIKeys(backendEnvPath);
    } else {
      log('  ○ You can configure API keys later in backend/.env', 'yellow');
    }
  }

  async configureAPIKeys(envPath) {
    log('\n🔑 Configuring AI Provider API Keys...', 'blue');
    log('You can skip any provider by pressing Enter without typing anything.\n', 'yellow');

    const providers = [
      {
        name: 'OpenAI',
        key: 'OPENAI_API_KEY',
        url: 'https://platform.openai.com/api-keys',
        description: 'For GPT models (most popular)'
      },
      {
        name: 'Google Gemini',
        key: 'GEMINI_API_KEY',
        url: 'https://makersuite.google.com/app/apikey',
        description: 'For Gemini models (good performance)'
      },
      {
        name: 'Mistral AI',
        key: 'MISTRAL_API_KEY',
        url: 'https://console.mistral.ai/',
        description: 'For Mistral models (open source)'
      },
      {
        name: 'Anthropic',
        key: 'ANTHROPIC_API_KEY',
        url: 'https://console.anthropic.com/',
        description: 'For Claude models (high quality)'
      }
    ];

    let envContent = fs.readFileSync(envPath, 'utf8');
    let keysConfigured = 0;

    for (const provider of providers) {
      log(`\n${provider.name} (${provider.description})`, 'cyan');
      log(`Get your key at: ${provider.url}`, 'blue');
      
      const apiKey = await this.askQuestion(
        `Enter your ${provider.name} API key (or press Enter to skip): `
      );

      if (apiKey.trim()) {
        // Update the environment file
        const keyRegex = new RegExp(`^${provider.key}=.*$`, 'm');
        if (keyRegex.test(envContent)) {
          envContent = envContent.replace(keyRegex, `${provider.key}=${apiKey.trim()}`);
        } else {
          envContent += `\n${provider.key}=${apiKey.trim()}`;
        }
        
        log(`  ✓ ${provider.name} API key configured`, 'green');
        keysConfigured++;
      } else {
        log(`  ○ Skipped ${provider.name}`, 'yellow');
      }
    }

    // Write updated environment file
    fs.writeFileSync(envPath, envContent);
    
    if (keysConfigured > 0) {
      log(`\n✅ Configured ${keysConfigured} API key(s)`, 'green');
    } else {
      log('\n⚠️  No API keys configured. You can add them later in backend/.env', 'yellow');
    }
  }

  async setupFrontendEnvironment() {
    log('\n📱 Setting up frontend environment...', 'blue');
    
    const frontendEnvPath = 'frontend/.env';
    const frontendEnvExamplePath = 'frontend/.env.example';
    
    // Check if .env already exists
    if (fs.existsSync(frontendEnvPath)) {
      const overwrite = await this.askYesNo(
        'Frontend .env file already exists. Overwrite?', 
        false
      );
      
      if (!overwrite) {
        log('  ○ Skipping frontend environment setup', 'yellow');
        return;
      }
    }

    // Copy from example if it exists
    if (fs.existsSync(frontendEnvExamplePath)) {
      fs.copyFileSync(frontendEnvExamplePath, frontendEnvPath);
      log('  ✓ Created frontend/.env from template', 'green');
    } else {
      // Create basic .env file
      const basicEnv = this.createBasicFrontendEnv();
      fs.writeFileSync(frontendEnvPath, basicEnv);
      log('  ✓ Created basic frontend/.env file', 'green');
    }

    // Update API URL to match backend
    let envContent = fs.readFileSync(frontendEnvPath, 'utf8');
    envContent = envContent.replace(
      /REACT_APP_API_URL=.*/,
      'REACT_APP_API_URL=http://localhost:9002'
    );
    fs.writeFileSync(frontendEnvPath, envContent);
    log('  ✓ Configured API URL to match backend', 'green');
  }

  createBasicBackendEnv() {
    return `# Private Lawyer Bot - Backend Environment Configuration
# Generated by setup script

# Server Configuration
HOST=0.0.0.0
PORT=9002
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production-please

# AI/LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_MOCK=true

# Performance Settings
MAX_WORKERS=4
REQUEST_TIMEOUT=30
RATE_LIMIT_PER_MINUTE=60
`;
  }

  createBasicFrontendEnv() {
    return `# Private Lawyer Bot - Frontend Environment Configuration
# Generated by setup script

# API Configuration
REACT_APP_API_URL=http://localhost:9002
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_CHAT=true
REACT_APP_ENABLE_DOCUMENTS=true
REACT_APP_ENABLE_LEGAL_RESEARCH=true

# UI Configuration
REACT_APP_DEFAULT_THEME=light
REACT_APP_ENABLE_ANIMATIONS=true
`;
  }

  async displaySummary() {
    log('\n' + '=' * 50, 'cyan');
    log('✅ ENVIRONMENT SETUP COMPLETE', 'green');
    log('=' * 50, 'cyan');

    log('\n📁 Files created/updated:', 'blue');
    if (fs.existsSync('backend/.env')) {
      log('  ✓ backend/.env', 'green');
    }
    if (fs.existsSync('frontend/.env')) {
      log('  ✓ frontend/.env', 'green');
    }

    log('\n🔑 API Key Configuration:', 'yellow');
    log('  • Add your AI provider API keys to backend/.env', 'yellow');
    log('  • At least one API key is required for AI features', 'yellow');
    log('  • You can test without API keys (limited functionality)', 'yellow');

    log('\n🚀 Next Steps:', 'cyan');
    log('  1. Install dependencies: npm run setup:deps', 'cyan');
    log('  2. Start the application: npm run dev', 'cyan');
    log('  3. Open http://localhost:3000 in your browser', 'cyan');

    log('\n💡 Tips:', 'magenta');
    log('  • Run "npm run health" to check system status', 'magenta');
    log('  • Edit .env files anytime to update configuration', 'magenta');
    log('  • Check README.md for detailed setup instructions', 'magenta');
  }

  // Utility methods
  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async askYesNo(question, defaultValue = true) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.askQuestion(`${question} (${defaultText}): `);
    
    if (!answer.trim()) {
      return defaultValue;
    }
    
    return answer.toLowerCase().startsWith('y');
  }
}

// Main execution
async function main() {
  const setup = new EnvironmentSetup();
  
  try {
    await setup.setup();
  } catch (error) {
    log(`\n❌ Environment setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnvironmentSetup;