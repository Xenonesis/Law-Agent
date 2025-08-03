#!/usr/bin/env node
/**
 * Production deployment readiness checker
 * Ensures the application is ready for production deployment
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

class DeploymentChecker {
  constructor() {
    this.results = {
      ready: false,
      checks: {},
      recommendations: [],
      blockers: [],
      warnings: []
    };
  }

  async runDeploymentChecks() {
    log('🚀 Private Lawyer Bot - Deployment Readiness Check', 'cyan');
    log('=' * 60, 'cyan');

    const checks = [
      { name: 'Environment Configuration', fn: () => this.checkEnvironmentConfig() },
      { name: 'Security Settings', fn: () => this.checkSecuritySettings() },
      { name: 'Build Process', fn: () => this.checkBuildProcess() },
      { name: 'Dependencies', fn: () => this.checkProductionDependencies() },
      { name: 'Performance Optimization', fn: () => this.checkPerformanceOptimization() },
      { name: 'Error Handling', fn: () => this.checkErrorHandling() },
      { name: 'Monitoring & Logging', fn: () => this.checkMonitoring() },
      { name: 'API Documentation', fn: () => this.checkDocumentation() },
      { name: 'Testing Coverage', fn: () => this.checkTestCoverage() },
      { name: 'Docker Configuration', fn: () => this.checkDockerConfig() }
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
          this.results.warnings.push(result.message);
        } else {
          log(`❌ ${check.name}: ${result.message}`, 'red');
          this.results.blockers.push(result.message);
        }

        if (result.recommendations) {
          this.results.recommendations.push(...result.recommendations);
        }
      } catch (error) {
        log(`❌ ${check.name}: ${error.message}`, 'red');
        this.results.blockers.push(`${check.name}: ${error.message}`);
      }
    }

    this.generateDeploymentReport();
  }

  checkEnvironmentConfig() {
    const issues = [];
    const recommendations = [];

    // Check backend environment
    const backendEnv = this.readEnvFile('backend/.env');
    if (!backendEnv) {
      issues.push('Backend .env file missing');
    } else {
      // Check critical production settings
      const criticalSettings = [
        'SECRET_KEY',
        'DEBUG',
        'SUPABASE_URL',
        'SUPABASE_KEY'
      ];

      for (const setting of criticalSettings) {
        if (!backendEnv[setting]) {
          issues.push(`Missing ${setting} in backend .env`);
        }
      }

      // Check if DEBUG is disabled for production
      if (backendEnv.DEBUG === 'true') {
        recommendations.push('Set DEBUG=false for production');
      }

      // Check if secret key is changed from default
      if (backendEnv.SECRET_KEY?.includes('change-in-production')) {
        issues.push('SECRET_KEY still contains default value');
      }
    }

    // Check frontend environment
    const frontendEnv = this.readEnvFile('frontend/.env');
    if (frontendEnv?.REACT_APP_ENVIRONMENT !== 'production') {
      recommendations.push('Set REACT_APP_ENVIRONMENT=production');
    }

    return {
      status: issues.length > 0 ? 'fail' : (recommendations.length > 0 ? 'warn' : 'pass'),
      message: issues.length > 0 
        ? `${issues.length} critical environment issues`
        : 'Environment configuration ready',
      issues,
      recommendations
    };
  }

  checkSecuritySettings() {
    const issues = [];
    const recommendations = [];

    // Check for security headers in backend
    const backendFiles = ['backend/enhanced_server.py', 'backend/fixed_server.py'];
    let hasSecurityHeaders = false;

    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('CORSMiddleware') || content.includes('cors')) {
          hasSecurityHeaders = true;
        }
      }
    }

    if (!hasSecurityHeaders) {
      issues.push('CORS configuration not found in backend');
    }

    // Check for HTTPS configuration
    const backendEnv = this.readEnvFile('backend/.env');
    if (backendEnv && !backendEnv.HTTPS_ENABLED) {
      recommendations.push('Enable HTTPS for production deployment');
    }

    // Check for rate limiting
    let hasRateLimit = false;
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('rate_limit') || content.includes('RateLimit')) {
          hasRateLimit = true;
        }
      }
    }

    if (!hasRateLimit) {
      recommendations.push('Implement rate limiting for production');
    }

    return {
      status: issues.length > 0 ? 'fail' : (recommendations.length > 0 ? 'warn' : 'pass'),
      message: issues.length > 0 
        ? `${issues.length} security issues found`
        : 'Security configuration looks good',
      issues,
      recommendations
    };
  }

  async checkBuildProcess() {
    const issues = [];
    const recommendations = [];

    try {
      // Test frontend build
      log('  Testing frontend build...', 'blue');
      execSync('cd frontend && npm run build', { stdio: 'pipe' });
      
      // Check if build directory exists and has content
      const buildDir = 'frontend/build';
      if (!fs.existsSync(buildDir)) {
        issues.push('Frontend build directory not created');
      } else {
        const buildFiles = fs.readdirSync(buildDir);
        if (buildFiles.length === 0) {
          issues.push('Frontend build directory is empty');
        }
      }
    } catch (error) {
      issues.push(`Frontend build failed: ${error.message}`);
    }

    try {
      // Test backend compilation
      log('  Testing backend compilation...', 'blue');
      execSync('cd backend && python -m py_compile *.py', { stdio: 'pipe' });
    } catch (error) {
      issues.push(`Backend compilation failed: ${error.message}`);
    }

    return {
      status: issues.length > 0 ? 'fail' : 'pass',
      message: issues.length > 0 
        ? `Build process has ${issues.length} issues`
        : 'Build process working correctly',
      issues,
      recommendations
    };
  }

  checkProductionDependencies() {
    const issues = [];
    const recommendations = [];

    // Check for production-only dependencies
    try {
      const backendReqs = fs.readFileSync('backend/requirements.txt', 'utf8');
      const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));

      // Check for development dependencies in production
      const devDeps = Object.keys(frontendPkg.devDependencies || {});
      if (devDeps.length > 20) {
        recommendations.push('Consider reducing development dependencies');
      }

      // Check for security vulnerabilities
      try {
        execSync('cd frontend && npm audit --audit-level high', { stdio: 'pipe' });
      } catch (error) {
        if (error.status === 1) {
          issues.push('High severity vulnerabilities found in frontend dependencies');
        }
      }

    } catch (error) {
      issues.push(`Dependency check failed: ${error.message}`);
    }

    return {
      status: issues.length > 0 ? 'fail' : (recommendations.length > 0 ? 'warn' : 'pass'),
      message: issues.length > 0 
        ? `${issues.length} dependency issues`
        : 'Dependencies ready for production',
      issues,
      recommendations
    };
  }

  checkPerformanceOptimization() {
    const recommendations = [];
    let score = 0;

    // Check for code splitting
    const frontendSrc = 'frontend/src';
    if (fs.existsSync(frontendSrc)) {
      const files = this.getAllFiles(frontendSrc, '.tsx');
      const hasLazyLoading = files.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('React.lazy') || content.includes('lazy(');
      });

      if (hasLazyLoading) {
        score += 25;
      } else {
        recommendations.push('Implement code splitting with React.lazy()');
      }
    }

    // Check for image optimization
    const publicDir = 'frontend/public';
    if (fs.existsSync(publicDir)) {
      const images = this.getAllFiles(publicDir, '.png', '.jpg', '.jpeg');
      if (images.length > 5) {
        recommendations.push('Consider optimizing images for production');
      } else {
        score += 25;
      }
    }

    // Check for caching configuration
    const backendFiles = ['backend/enhanced_server.py', 'backend/fixed_server.py'];
    let hasCaching = false;
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('cache') || content.includes('Cache')) {
          hasCaching = true;
          score += 25;
        }
      }
    }

    if (!hasCaching) {
      recommendations.push('Implement caching for better performance');
    }

    // Check for compression
    let hasCompression = false;
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('GZip') || content.includes('compression')) {
          hasCompression = true;
          score += 25;
        }
      }
    }

    if (!hasCompression) {
      recommendations.push('Enable gzip compression');
    }

    return {
      status: score >= 75 ? 'pass' : (score >= 50 ? 'warn' : 'fail'),
      message: `Performance optimization score: ${score}/100`,
      score,
      recommendations
    };
  }

  checkErrorHandling() {
    const issues = [];
    const recommendations = [];

    // Check backend error handling
    const backendFiles = ['backend/enhanced_server.py', 'backend/fixed_server.py'];
    let hasErrorHandling = false;

    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('try:') && content.includes('except:')) {
          hasErrorHandling = true;
        }
        if (content.includes('HTTPException') || content.includes('exception_handler')) {
          hasErrorHandling = true;
        }
      }
    }

    if (!hasErrorHandling) {
      issues.push('Insufficient error handling in backend');
    }

    // Check frontend error boundaries
    const frontendSrc = 'frontend/src';
    if (fs.existsSync(frontendSrc)) {
      const files = this.getAllFiles(frontendSrc, '.tsx');
      const hasErrorBoundary = files.some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('ErrorBoundary') || content.includes('componentDidCatch');
      });

      if (!hasErrorBoundary) {
        recommendations.push('Implement React Error Boundaries');
      }
    }

    return {
      status: issues.length > 0 ? 'fail' : (recommendations.length > 0 ? 'warn' : 'pass'),
      message: issues.length > 0 
        ? `${issues.length} error handling issues`
        : 'Error handling implemented',
      issues,
      recommendations
    };
  }

  checkMonitoring() {
    const recommendations = [];
    let hasMonitoring = false;

    // Check for logging configuration
    const backendFiles = ['backend/enhanced_server.py', 'backend/fixed_server.py'];
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('logging') || content.includes('logger')) {
          hasMonitoring = true;
        }
      }
    }

    if (!hasMonitoring) {
      recommendations.push('Implement comprehensive logging');
    }

    // Check for health check endpoints
    let hasHealthCheck = false;
    for (const file of backendFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('/health') || content.includes('health_check')) {
          hasHealthCheck = true;
        }
      }
    }

    if (!hasHealthCheck) {
      recommendations.push('Add health check endpoints');
    }

    return {
      status: recommendations.length === 0 ? 'pass' : 'warn',
      message: recommendations.length === 0 
        ? 'Monitoring and logging configured'
        : `${recommendations.length} monitoring improvements suggested`,
      recommendations
    };
  }

  checkDocumentation() {
    const issues = [];
    const recommendations = [];

    // Check for API documentation
    const hasSwagger = fs.existsSync('backend/enhanced_server.py') && 
      fs.readFileSync('backend/enhanced_server.py', 'utf8').includes('docs_url');

    if (!hasSwagger) {
      recommendations.push('Enable API documentation (Swagger/OpenAPI)');
    }

    // Check for README
    if (!fs.existsSync('README.md')) {
      issues.push('README.md missing');
    }

    // Check for deployment documentation
    const deploymentDocs = ['DEPLOYMENT.md', 'docs/deployment.md'];
    const hasDeploymentDocs = deploymentDocs.some(doc => fs.existsSync(doc));
    
    if (!hasDeploymentDocs) {
      recommendations.push('Create deployment documentation');
    }

    return {
      status: issues.length > 0 ? 'fail' : (recommendations.length > 0 ? 'warn' : 'pass'),
      message: issues.length > 0 
        ? `${issues.length} documentation issues`
        : 'Documentation ready',
      issues,
      recommendations
    };
  }

  checkTestCoverage() {
    const recommendations = [];
    let hasTests = false;

    // Check for frontend tests
    const frontendTests = this.getAllFiles('frontend/src', '.test.tsx', '.test.ts');
    if (frontendTests.length > 0) {
      hasTests = true;
    } else {
      recommendations.push('Add frontend unit tests');
    }

    // Check for backend tests
    const backendTestDir = 'backend/tests';
    if (fs.existsSync(backendTestDir)) {
      const backendTests = this.getAllFiles(backendTestDir, '.py');
      if (backendTests.length > 0) {
        hasTests = true;
      }
    } else {
      recommendations.push('Add backend unit tests');
    }

    return {
      status: hasTests ? 'pass' : 'warn',
      message: hasTests 
        ? 'Tests are present'
        : 'No tests found - consider adding test coverage',
      recommendations
    };
  }

  checkDockerConfig() {
    const recommendations = [];
    let hasDocker = false;

    // Check for Dockerfile
    const dockerFiles = ['Dockerfile', 'backend/Dockerfile', 'frontend/Dockerfile'];
    hasDocker = dockerFiles.some(file => fs.existsSync(file));

    // Check for docker-compose
    const composeFiles = ['docker-compose.yml', 'docker-compose.yaml'];
    const hasCompose = composeFiles.some(file => fs.existsSync(file));

    if (!hasDocker && !hasCompose) {
      recommendations.push('Consider adding Docker configuration for easier deployment');
    }

    return {
      status: 'pass', // Docker is optional
      message: hasDocker || hasCompose 
        ? 'Docker configuration present'
        : 'No Docker configuration (optional)',
      recommendations
    };
  }

  // Utility methods
  readEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  }

  getAllFiles(dir, ...extensions) {
    if (!fs.existsSync(dir)) return [];
    
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, ...extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  generateDeploymentReport() {
    log('\n' + '=' * 60, 'cyan');
    log('📊 DEPLOYMENT READINESS REPORT', 'cyan');
    log('=' * 60, 'cyan');

    const { blockers, warnings, recommendations } = this.results;
    
    // Overall readiness
    this.results.ready = blockers.length === 0;
    const readinessColor = this.results.ready ? 'green' : 'red';
    const readinessIcon = this.results.ready ? '✅' : '❌';
    
    log(`\n${readinessIcon} Deployment Ready: ${this.results.ready ? 'YES' : 'NO'}`, readinessColor);

    // Blockers
    if (blockers.length > 0) {
      log(`\n🚫 CRITICAL ISSUES (${blockers.length}):`, 'red');
      blockers.forEach(blocker => log(`   • ${blocker}`, 'red'));
    }

    // Warnings
    if (warnings.length > 0) {
      log(`\n⚠️  WARNINGS (${warnings.length}):`, 'yellow');
      warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
    }

    // Recommendations
    if (recommendations.length > 0) {
      log(`\n💡 RECOMMENDATIONS (${recommendations.length}):`, 'blue');
      recommendations.forEach(rec => log(`   • ${rec}`, 'blue'));
    }

    // Next steps
    log('\n🎯 NEXT STEPS:', 'magenta');
    
    if (this.results.ready) {
      log('• Your application is ready for production deployment!', 'green');
      log('• Consider implementing the recommendations for optimal performance', 'green');
      log('• Set up monitoring and alerting in your production environment', 'green');
    } else {
      log('• Resolve all critical issues before deploying', 'red');
      log('• Address warnings to improve production stability', 'yellow');
      log('• Run this check again after making changes', 'blue');
    }

    // Deployment platforms
    log('\n🌐 RECOMMENDED DEPLOYMENT PLATFORMS:', 'cyan');
    log('• Backend: Railway, Heroku, DigitalOcean, AWS', 'cyan');
    log('• Frontend: Vercel, Netlify, AWS S3 + CloudFront', 'cyan');
    log('• Database: Supabase, PlanetScale, AWS RDS', 'cyan');

    // Save report
    try {
      const reportPath = path.join(process.cwd(), 'deployment-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
    } catch (error) {
      log(`\n⚠️  Could not save report: ${error.message}`, 'yellow');
    }
  }
}

// Main execution
async function main() {
  const checker = new DeploymentChecker();
  await checker.runDeploymentChecks();
  
  // Exit with appropriate code
  const exitCode = checker.results.ready ? 0 : 1;
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Deployment check failed:', error);
    process.exit(1);
  });
}

module.exports = { DeploymentChecker };