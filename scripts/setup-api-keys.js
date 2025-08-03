#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupApiKeys() {
    console.log('🔧 API Key Setup for Private Lawyer Bot');
    console.log('=====================================\n');
    
    const envPath = path.join(__dirname, '..', 'backend', '.env');
    
    // Read current .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    } else {
        console.log('❌ .env file not found. Please run this from the project root.');
        process.exit(1);
    }
    
    console.log('Configure at least one API key to enable AI responses:\n');
    
    // OpenAI API Key
    console.log('1. OpenAI API Key');
    console.log('   Get your key from: https://platform.openai.com/api-keys');
    const openaiKey = await question('   Enter your OpenAI API key (or press Enter to skip): ');
    
    if (openaiKey.trim()) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*/, `OPENAI_API_KEY=${openaiKey.trim()}`);
        console.log('   ✅ OpenAI API key configured\n');
    } else {
        console.log('   ⏭️  Skipped OpenAI configuration\n');
    }
    
    // Gemini API Key
    console.log('2. Google Gemini API Key');
    console.log('   Get your key from: https://makersuite.google.com/app/apikey');
    const geminiKey = await question('   Enter your Gemini API key (or press Enter to skip): ');
    
    if (geminiKey.trim()) {
        envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${geminiKey.trim()}`);
        console.log('   ✅ Gemini API key configured\n');
    } else {
        console.log('   ⏭️  Skipped Gemini configuration\n');
    }
    
    // Mistral API Key
    console.log('3. Mistral API Key');
    console.log('   Get your key from: https://console.mistral.ai/');
    const mistralKey = await question('   Enter your Mistral API key (or press Enter to skip): ');
    
    if (mistralKey.trim()) {
        envContent = envContent.replace(/MISTRAL_API_KEY=.*/, `MISTRAL_API_KEY=${mistralKey.trim()}`);
        console.log('   ✅ Mistral API key configured\n');
    } else {
        console.log('   ⏭️  Skipped Mistral configuration\n');
    }
    
    // Write updated .env file
    fs.writeFileSync(envPath, envContent);
    
    // Check if any keys were configured
    const hasOpenAI = envContent.includes('OPENAI_API_KEY=') && !envContent.includes('OPENAI_API_KEY=\n');
    const hasGemini = envContent.includes('GEMINI_API_KEY=') && !envContent.includes('GEMINI_API_KEY=\n');
    const hasMistral = envContent.includes('MISTRAL_API_KEY=') && !envContent.includes('MISTRAL_API_KEY=\n');
    
    if (hasOpenAI || hasGemini || hasMistral) {
        console.log('🎉 Configuration complete!');
        console.log('\nConfigured providers:');
        if (hasOpenAI) console.log('   ✅ OpenAI');
        if (hasGemini) console.log('   ✅ Gemini');
        if (hasMistral) console.log('   ✅ Mistral');
        
        console.log('\n📋 Next steps:');
        console.log('   1. Install Python dependencies: pip install -r backend/requirements.txt');
        console.log('   2. Start the backend: python backend/fixed_server.py');
        console.log('   3. Start the frontend: npm run dev');
    } else {
        console.log('⚠️  No API keys were configured.');
        console.log('   The bot will show setup instructions to users.');
        console.log('   You can run this script again anytime to configure keys.');
    }
    
    rl.close();
}

setupApiKeys().catch(console.error);