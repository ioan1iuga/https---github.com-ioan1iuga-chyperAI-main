import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const BACKEND_DIR = path.join(__dirname, '../backend');
const SERVER_PORT = process.env.PORT || 3001;
const HEALTH_ENDPOINT = `http://localhost:${SERVER_PORT}/health`;
const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

// Check if backend directory exists
if (!fs.existsSync(BACKEND_DIR)) {
  console.error('❌ Backend directory not found at:', BACKEND_DIR);
  process.exit(1);
}

// Copy .env file to backend directory if it doesn't exist
function copyEnvFile() {
  const rootEnvPath = path.join(__dirname, '../.env');
  const backendEnvPath = path.join(BACKEND_DIR, '.env');
  
  if (fs.existsSync(rootEnvPath) && !fs.existsSync(backendEnvPath)) {
    console.log('📋 Copying .env file to backend directory...');
    fs.copyFileSync(rootEnvPath, backendEnvPath);
    console.log('✅ .env file copied to backend directory');
  } else if (fs.existsSync(backendEnvPath)) {
    console.log('📋 Backend .env file already exists');
  } else {
    console.warn('⚠️ No .env file found in project root. Backend may not function correctly.');
  }
}
// Check if backend is already running
function checkBackendRunning() {
  return new Promise((resolve) => {
    exec(`curl -s -o /dev/null -w "%{http_code}" ${HEALTH_ENDPOINT}`, (error, stdout) => {
      if (!error && stdout.trim() === '200') {
        console.log('✅ Backend server is already running at', HEALTH_ENDPOINT);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

// Install dependencies if needed
function installDependencies() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(BACKEND_DIR, 'node_modules'))) {
      console.log('📦 Installing backend dependencies...');
      const install = spawn('npm', ['install'], { cwd: BACKEND_DIR, stdio: 'inherit' });
      
      install.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Backend dependencies installed');
          resolve();
        } else {
          reject(new Error(`❌ Failed to install backend dependencies (exit code: ${code})`));
        }
      });
    } else {
      resolve();
    }
  });
}

// Start the backend server and wait until it's ready
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting backend server...');
    
    // Include PORT environment variable
    const env = { ...process.env, PORT: SERVER_PORT };
    
    const server = spawn('node', ['src/server.js'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit',
      env
    });

    server.on('error', (err) => {
      console.error('❌ Failed to start backend server:', err);
      reject(err);
    });

    // Forward signals to the child process
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => {
        server.kill(signal);
        process.exit(0);
      });
    });

    // Poll for server readiness
    let retries = 0;
    
    function checkServerReady() {
      exec(`curl -s -o /dev/null -w "%{http_code}" ${HEALTH_ENDPOINT}`, (error, stdout) => {
        if (!error && stdout.trim() === '200') {
          console.log('✅ Backend server is ready');
          resolve(server);
        } else {
          retries++;
          if (retries <= MAX_RETRIES) {
            console.log(`⏳ Waiting for backend to start (attempt ${retries}/${MAX_RETRIES})...`);
            if (retries >= 3) {
              console.log('💡 Hint: If you\'re seeing CORS errors in the browser, check the backend server\'s CORS configuration');
            }
            setTimeout(checkServerReady, RETRY_DELAY);  
          } else {
            console.error(`❌ Backend health check timed out after ${MAX_RETRIES} attempts`);
            console.error('❌ The backend server might not be fully initialized or has configuration issues');
            console.error('💡 Possible causes:');
            console.error('   - CORS configuration issues');
            console.error('   - Port conflicts');
            console.error('   - Network configuration issues');
            console.error('💡 Check the backend server logs for more details');

            // Rather than rejecting, we'll resolve with the server instance but log warnings
            // This allows the frontend to continue running even if backend isn't ready yet
            console.warn('⚠️ Continuing startup despite backend health check timeout');
            resolve(server);
          }
        }
      });
    }

    // Start checking if server is ready after a short delay
    setTimeout(checkServerReady, 1000);
  });
}

// Main execution flow
async function main() {
  try {
    // Check if backend is already running
    const isRunning = await checkBackendRunning();
    if (isRunning) {
      console.log('✅ Backend server is already running');
      return;
    }

    // Copy .env file if needed
    copyEnvFile();

    // Ensure dependencies are installed
    await installDependencies();
    
    // Start the backend server and wait for it to be ready
    await startBackend();
    
    console.log('🎉 Backend startup process completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();