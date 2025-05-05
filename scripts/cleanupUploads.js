// Script to mark uploads as temporary and clean them up
const { connectDB, getPool } = require('../backend/config/db');
const fs = require('fs');
const path = require('path');

const cleanupUploads = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Getting database pool...');
    const pool = getPool();
    
    if (!pool) {
      console.error('Cannot get database pool');
      process.exit(1);
    }
    
    const connection = await pool.getConnection();
    
    try {
      console.log('Beginning transaction...');
      await connection.beginTransaction();
      
      // First, check if there are any uploads
      const [uploadCount] = await connection.query('SELECT COUNT(*) as count FROM uploaded_files');
      console.log(`Found ${uploadCount[0].count} uploads in the database`);
      
      if (uploadCount[0].count === 0) {
        console.log('No uploads to clean up');
        await connection.commit();
        return;
      }
      
      // Add the temporary column if it doesn't exist
      console.log('Checking if temporary column exists...');
      try {
        await connection.query('SELECT temporary FROM uploaded_files LIMIT 1');
        console.log('Temporary column already exists');
      } catch (error) {
        console.log('Adding temporary column to uploaded_files...');
        await connection.query('ALTER TABLE uploaded_files ADD COLUMN temporary BOOLEAN DEFAULT FALSE');
      }
      
      // Mark all uploads as temporary that don't have an order_id
      console.log('Marking uploads without order_id as temporary...');
      await connection.query('UPDATE uploaded_files SET temporary = TRUE WHERE order_id IS NULL');
      
      // Get all uploads that are marked as temporary
      const [tempUploads] = await connection.query('SELECT * FROM uploaded_files WHERE temporary = TRUE');
      console.log(`Found ${tempUploads.length} temporary uploads to delete`);
      
      // Delete temporary uploads one by one
      for (const upload of tempUploads) {
        console.log(`Deleting temporary upload: ${upload.id} - ${upload.original_name}`);
        
        // Delete model_data if it exists
        await connection.query('DELETE FROM model_data WHERE file_id = ?', [upload.id]);
        
        // Delete the file record
        await connection.query('DELETE FROM uploaded_files WHERE id = ?', [upload.id]);
        
        // Delete the physical file if it exists
        if (upload.path && fs.existsSync(upload.path)) {
          console.log(`Deleting physical file: ${upload.path}`);
          fs.unlinkSync(upload.path);
        }
        
        // Delete the thumbnail if it exists
        if (upload.thumbnail_url) {
          const thumbnailPath = upload.thumbnail_url.replace(/^https?:\/\/[^\/]+\//, '');
          const fullThumbnailPath = path.join(__dirname, '..', thumbnailPath);
          
          if (fs.existsSync(fullThumbnailPath)) {
            console.log(`Deleting thumbnail: ${fullThumbnailPath}`);
            fs.unlinkSync(fullThumbnailPath);
          }
        }
      }
      
      // Commit the transaction
      await connection.commit();
      console.log('Successfully cleaned up temporary uploads');
      
    } catch (error) {
      // If error, rollback
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up uploads:', error);
    process.exit(1);
  }
};

cleanupUploads();