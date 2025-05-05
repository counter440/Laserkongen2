/**
 * Setup script to add temporary file cleanup cron job
 * 
 * This script adds a cron job to run the cleanup-temp-files.js script every hour
 * Run this script once to set up the automatic cleanup
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get absolute path to cleanup script
const cleanupScriptPath = path.resolve(__dirname, 'cleanup-temp-files.js');
console.log(`Cleanup script path: ${cleanupScriptPath}`);

// Create crontab entry to run the cleanup script every hour
const cronEntry = `0 * * * * node ${cleanupScriptPath} >> ${path.resolve(__dirname, '../logs/cleanup.log')} 2>&1\n`;
console.log(`Adding cron entry: ${cronEntry}`);

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log(`Created logs directory: ${logsDir}`);
}

// Function to run a command and get output
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

async function setup() {
  try {
    // Get current crontab
    const currentCrontab = await runCommand('crontab', ['-l']).catch(() => '');
    console.log('Current crontab:');
    console.log(currentCrontab || '(empty)');
    
    // Check if our entry already exists
    if (currentCrontab.includes(cleanupScriptPath)) {
      console.log('Cleanup task already exists in crontab. No changes needed.');
      return;
    }
    
    // Add our entry
    const newCrontab = (currentCrontab || '') + cronEntry;
    
    // Write to a temporary file
    const tempFile = path.resolve(__dirname, 'temp-crontab');
    fs.writeFileSync(tempFile, newCrontab);
    
    // Install the new crontab
    await runCommand('crontab', [tempFile]);
    console.log('Successfully installed crontab with cleanup task');
    
    // Remove the temporary file
    fs.unlinkSync(tempFile);
    
    console.log('Cron job setup complete. Temporary files will be cleaned up hourly.');
  } catch (error) {
    console.error('Error setting up cron job:', error.message);
  }
}

// If run directly from command line
if (require.main === module) {
  setup()
    .then(() => {
      console.log('Setup completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = setup;
}