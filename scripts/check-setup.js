#!/usr/bin/env node

/**
 * Setup Verification Script
 * Verifica que todos los requisitos estén configurados correctamente
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function log(icon, message, color = '') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };

  const colorCode = colors[color] || colors.reset;
  console.log(`${colorCode}${icon} ${message}${colors.reset}`);
}

async function checkNodeVersion() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    if (majorVersion >= 22) {
      checks.passed.push(`Node.js version: ${version}`);
      log('✅', `Node.js ${version}`, 'green');
    } else {
      checks.failed.push(`Node.js version too old: ${version}`);
      log('❌', `Node.js ${version} (required: 22+)`, 'red');
    }
  } catch (error) {
    checks.failed.push('Node.js not found');
    log('❌', 'Node.js not installed', 'red');
  }
}

async function checkDocker() {
  try {
    const { stdout } = await execAsync('docker --version');
    checks.passed.push('Docker is installed');
    log('✅', stdout.trim(), 'green');

    // Check if Docker is running
    try {
      await execAsync('docker ps');
      checks.passed.push('Docker is running');
      log('✅', 'Docker daemon is running', 'green');
    } catch {
      checks.warnings.push('Docker is installed but not running');
      log('⚠️', 'Docker is installed but not running. Start Docker Desktop.', 'yellow');
    }
  } catch (error) {
    checks.failed.push('Docker not installed');
    log('❌', 'Docker not installed. Install Docker Desktop.', 'red');
  }
}

async function checkRedis() {
  try {
    const { stdout } = await execAsync('docker ps | grep redis');
    if (stdout.includes('redis')) {
      checks.passed.push('Redis container is running');
      log('✅', 'Redis container is running', 'green');
    } else {
      checks.warnings.push('Redis container not running');
      log('⚠️', 'Redis container not running. Run: docker start sponsor-badge-redis', 'yellow');
    }
  } catch (error) {
    checks.warnings.push('Redis container not found');
    log('⚠️', 'Redis container not found. See QUICKSTART.md Step 2', 'yellow');
  }
}

function checkEnvFile() {
  const envPath = join(projectRoot, '.env');

  if (existsSync(envPath)) {
    checks.passed.push('.env file exists');
    log('✅', '.env file exists', 'green');

    // Check for required variables
    const envContent = readFileSync(envPath, 'utf-8');
    const requiredVars = ['GITHUB_TOKEN', 'REDIS_URL'];

    requiredVars.forEach(varName => {
      const regex = new RegExp(`${varName}=(.+)`);
      const match = envContent.match(regex);

      if (match && match[1].trim() && !match[1].includes('xxx') && !match[1].includes('your')) {
        checks.passed.push(`${varName} is configured`);
        log('✅', `${varName} is configured`, 'green');
      } else {
        checks.failed.push(`${varName} not configured`);
        log('❌', `${varName} not configured in .env`, 'red');
      }
    });
  } else {
    checks.failed.push('.env file missing');
    log('❌', '.env file not found. Run: cp .env.example .env', 'red');
  }
}

function checkDependencies() {
  const packageJsonPath = join(projectRoot, 'package.json');
  const nodeModulesPath = join(projectRoot, 'node_modules');

  if (existsSync(nodeModulesPath)) {
    checks.passed.push('Dependencies installed');
    log('✅', 'Dependencies installed', 'green');
  } else {
    checks.failed.push('Dependencies not installed');
    log('❌', 'Dependencies not installed. Run: npm install', 'red');
  }
}

function checkBuild() {
  const distPath = join(projectRoot, 'dist');

  if (existsSync(distPath)) {
    checks.passed.push('Project built');
    log('✅', 'TypeScript compiled (dist/ exists)', 'green');
  } else {
    checks.warnings.push('Project not built');
    log('⚠️', 'Project not built yet. Run: npm run build', 'yellow');
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  log('✅', `Passed: ${checks.passed.length}`, 'green');
  log('⚠️', `Warnings: ${checks.warnings.length}`, 'yellow');
  log('❌', `Failed: ${checks.failed.length}`, 'red');

  console.log('\n');

  if (checks.failed.length === 0 && checks.warnings.length === 0) {
    log('🎉', 'All checks passed! You\'re ready to run the server.', 'green');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000/health');
    console.log('   3. Test badge: http://localhost:3000/badge/github/sindresorhus/5000\n');
  } else if (checks.failed.length === 0) {
    log('👍', 'Critical checks passed. You can start the server.', 'green');
    console.log('\n📝 To resolve warnings:');
    checks.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
    console.log('\n');
  } else {
    log('⛔', 'Please fix the following issues before starting:', 'red');
    console.log('\n🔧 Required fixes:');
    checks.failed.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log('\n📖 See QUICKSTART.md for detailed instructions.\n');
  }
}

async function main() {
  console.log('\n🔍 Checking Sponsor Badge setup...\n');

  await checkNodeVersion();
  await checkDocker();
  await checkRedis();
  checkEnvFile();
  checkDependencies();
  checkBuild();

  await printSummary();
}

main().catch(console.error);
