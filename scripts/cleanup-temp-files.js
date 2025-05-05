/**
 * Cleanup script for temporary files
 * 
 * This script deletes temporary files that are older than 1 hour and have no order ID
 * Run this script on a regular schedule (e.g., every hour)
 */

const fs = require('fs');
const path = require('path');
const { getPool } = require('../backend/config/db');
const UploadedFile = require('../backend/models/UploadedFile');

async function cleanupTemporaryFiles() {
  console.log('Starting temporary file cleanup process...');
  
  try {
    // Ensure database connection
    const pool = getPool();
    if (!pool) {
      console.error('Database connection not available');
      return;
    }
    
    // Calculate cutoff time (1 hour ago)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const cutoffTime = oneHourAgo.toISOString().slice(0, 19).replace('T', ' ');
    console.log(`Cutoff time for temporary files: ${cutoffTime}`);
    
    // Find temporary files older than 1 hour
    const [tempFiles] = await pool.query(
      `SELECT * FROM uploaded_files 
       WHERE temporary = 1 
       AND order_id IS NULL 
       AND created_at < ?`,
      [cutoffTime]
    );
    
    console.log(`Found ${tempFiles.length} temporary files to delete`);
    
    // Delete each file
    for (const file of tempFiles) {
      try {
        console.log(`Processing file: ${file.id} - ${file.originalName || file.filename}`);
        
        // 1. First try to delete the physical file
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Deleted physical file: ${file.path}`);
        } else {
          console.log(`Physical file not found at ${file.path}`);
        }
        
        // 2. Delete the thumbnail if it exists
        if (file.thumbnailUrl) {
          const thumbnailPath = file.thumbnailUrl.replace(/^https?:\/\/[^\/]+\//, '');
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
            console.log(`Deleted thumbnail: ${thumbnailPath}`);
          }
        }
        
        // 3. Delete the database entry
        const [deleteResult] = await pool.query(
          'DELETE FROM uploaded_files WHERE id = ?',
          [file.id]
        );
        
        if (deleteResult.affectedRows > 0) {
          console.log(`Deleted file record from database: ${file.id}`);
        } else {
          console.log(`Failed to delete file record from database: ${file.id}`);
        }
        
        // 4. Also delete any model data
        if (file.fileType === '3d-model') {
          await pool.query(
            'DELETE FROM model_data WHERE file_id = ?',
            [file.id]
          );
          console.log(`Deleted model data for file: ${file.id}`);
        }
      } catch (fileError) {
        console.error(`Error deleting file ${file.id}:`, fileError);
      }
    }
    
    console.log('Temporary file cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup process:', error);
  }
}

// If run directly from command line
if (require.main === module) {
  cleanupTemporaryFiles()
    .then(() => {
      console.log('Cleanup script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Cleanup script failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = cleanupTemporaryFiles;
}