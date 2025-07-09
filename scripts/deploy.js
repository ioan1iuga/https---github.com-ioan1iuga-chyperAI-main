#!/usr/bin/env node

/**
 * Universal deployment script for ChyperAI
 * Supports multiple deployment providers with a consistent interface
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Deployment providers
const PROVIDERS = ['netlify', 'vercel', 'cloudflare'];

// Command line arguments
const args = process.argv.slice(2);
const provider = args[0]?.toLowerCase();
const environment = args[1]?.toLowerCase() || 'production';

// Check if provider is valid
if (provider && !PROVIDERS.includes(provider)) {
  console.error(`Error: Invalid provider '${provider}'. Available providers: ${PROVIDERS.join(', ')}`);
  process.exit(1);
}

// If no provider is specified, try to detect from environment
const detectedProvider = provider || detectProvider();

// If still no provider, use default
const selectedProvider = detectedProvider || 'netlify';

// Display banner
console.log(`
🚀 ChyperAI Deployment (${selectedProvider} - ${environment})
=============================================
Provider: ${selectedProvider}
Environment: ${environment}
`);

// Run deployment
try {
  deploy(selectedProvider, environment);
} catch (error) {
  console.error(`\n❌ Deployment failed: ${error.message}`);
  process.exit(1);
}

/**
 * Deploy the application using the specified provider
 */
function deploy(provider, environment) {
  console.log('📦 Building application...');
  
  // Build the application
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build complete');
  console.log(`🚀 Deploying to ${provider} (${environment})...`);
  
  // Deploy based on provider
  switch (provider) {
    case 'netlify':
      deployToNetlify(environment);
      break;
    case 'vercel':
      deployToVercel(environment);
      break;
    case 'cloudflare':
      deployToCloudflare(environment);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Deploy to Netlify
 */
function deployToNetlify(environment) {
  // Check for Netlify CLI
  try {
    execSync('netlify --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📦 Installing Netlify CLI...');
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
  }
  
  // Check for netlify.toml
  if (!existsSync(join(process.cwd(), 'netlify.toml'))) {
    console.log('⚠️ netlify.toml not found. Creating a basic configuration...');
    createNetlifyConfig();
  }
  
  // Deploy to Netlify
  if (environment === 'production') {
    execSync('netlify deploy --prod', { stdio: 'inherit' });
  } else {
    execSync(`netlify deploy --alias ${environment}`, { stdio: 'inherit' });
  }
  
  console.log('✅ Netlify deployment complete');
}

/**
 * Deploy to Vercel
 */
function deployToVercel(environment) {
  // Check for Vercel CLI
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📦 Installing Vercel CLI...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }
  
  // Deploy to Vercel
  if (environment === 'production') {
    execSync('vercel --prod', { stdio: 'inherit' });
  } else {
    execSync(`vercel --env ENVIRONMENT=${environment}`, { stdio: 'inherit' });
  }
  
  console.log('✅ Vercel deployment complete');
}

/**
 * Deploy to Cloudflare Pages
 */
function deployToCloudflare(environment) {
  // Check for Wrangler
  try {
    execSync('wrangler --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('📦 Installing Wrangler...');
    execSync('npm install -g wrangler', { stdio: 'inherit' });
  }
  
  // Check for wrangler.toml
  if (!existsSync(join(process.cwd(), 'wrangler.toml'))) {
    console.log('⚠️ wrangler.toml not found. Creating a basic configuration...');
    createWranglerConfig();
  }
  
  // Deploy to Cloudflare
  if (environment === 'production') {
    execSync('wrangler pages deploy dist', { stdio: 'inherit' });
  } else {
    execSync(`wrangler pages deploy dist --branch=${environment}`, { stdio: 'inherit' });
  }
  
  console.log('✅ Cloudflare deployment complete');
}

/**
 * Create a basic netlify.toml file
 */
function createNetlifyConfig() {
  const config = `# Netlify configuration

# Handle SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API proxy - replace with your actual API URL
[[redirects]]
  from = "/api/*"
  to = "${process.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://api.example.com'}/functions/v1/:splat"
  status = 200
  force = true
  headers = {Authorization = "Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}"}

# Build settings
[build]
  command = "npm run build"
  publish = "dist"
  environment = { NODE_VERSION = "18" }

# Environment variable configuration
[context.production.environment]
  VITE_APP_ENV = "production"

[context.deploy-preview.environment]
  VITE_APP_ENV = "preview"
  
[context.branch-deploy.environment]
  VITE_APP_ENV = "staging"
`;

  writeFileSync(join(process.cwd(), 'netlify.toml'), config);
  console.log('✅ Created netlify.toml');
}

/**
 * Create a basic wrangler.toml file
 */
function createWranglerConfig() {
  const config = `# Cloudflare Workers Configuration

name = "chyper-ai-platform"
compatibility_date = "2024-01-15"

[site]
bucket = "./dist"
`;

  writeFileSync(join(process.cwd(), 'wrangler.toml'), config);
  console.log('✅ Created wrangler.toml');
}

/**
 * Detect deployment provider from environment
 */
function detectProvider() {
  // Check for provider-specific environment variables
  if (process.env.NETLIFY || process.env.VITE_NETLIFY_AUTH_TOKEN) {
    return 'netlify';
  }
  
  if (process.env.VERCEL || process.env.VITE_VERCEL_AUTH_TOKEN) {
    return 'vercel';
  }
  
  if (process.env.CLOUDFLARE_API_TOKEN || process.env.VITE_CLOUDFLARE_API_TOKEN) {
    return 'cloudflare';
  }
  
  // Check for provider-specific config files
  if (existsSync(join(process.cwd(), 'netlify.toml'))) {
    return 'netlify';
  }
  
  if (existsSync(join(process.cwd(), 'vercel.json'))) {
    return 'vercel';
  }
  
  if (existsSync(join(process.cwd(), 'wrangler.toml'))) {
    return 'cloudflare';
  }
  
  // Check environment variable preference
  if (process.env.VITE_DEFAULT_DEPLOYMENT_PROVIDER) {
    return process.env.VITE_DEFAULT_DEPLOYMENT_PROVIDER;
  }
  
  // No provider detected
  return null;
}