const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'laserkongen',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    console.log('Using database:', process.env.MYSQL_DATABASE || 'laserkongen');
    
    // Test the connection
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }
    
    // Get a connection from the pool
    const connection = await pool.getConnection();
    
    try {
      // Start a transaction
      await connection.beginTransaction();
      console.log('Transaction started');
      
      // Delete order_custom_options first (foreign key constraint)
      console.log('Deleting order_custom_options...');
      await connection.query('DELETE FROM order_custom_options');
      
      // Delete order_items (foreign key constraint)
      console.log('Deleting order_items...');
      await connection.query('DELETE FROM order_items');
      
      // Delete order_shipping_address (foreign key constraint)
      console.log('Deleting order_shipping_address...');
      await connection.query('DELETE FROM order_shipping_address');
      
      // Delete order_payment_results (foreign key constraint)
      console.log('Deleting order_payment_results...');
      await connection.query('DELETE FROM order_payment_results');
      
      // Reset uploaded files order_id
      console.log('Clearing order_id references from uploaded_files...');
      await connection.query('UPDATE uploaded_files SET order_id = NULL WHERE order_id IS NOT NULL');
      
      // Delete all orders
      console.log('Deleting all orders...');
      await connection.query('DELETE FROM orders');
      
      // Reset auto-increment counters
      console.log('Resetting auto-increment counters...');
      await connection.query('ALTER TABLE orders AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE order_items AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE order_shipping_address AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE order_custom_options AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE order_payment_results AUTO_INCREMENT = 1');
      
      // Optionally, delete uploaded files
      console.log('Deleting uploaded file records...');
      await connection.query('DELETE FROM model_data');
      await connection.query('DELETE FROM uploaded_files');
      await connection.query('ALTER TABLE uploaded_files AUTO_INCREMENT = 1');
      await connection.query('ALTER TABLE model_data AUTO_INCREMENT = 1');
      
      // Commit the transaction
      await connection.commit();
      console.log('Database reset completed successfully');
      
      // Clean up file storage
      cleanupFileStorage();
      
    } catch (error) {
      // If there's an error, roll back the transaction
      await connection.rollback();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
    
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }
}

function cleanupFileStorage() {
  try {
    console.log('Cleaning up file storage...');
    
    // Define paths to clean up
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Clean up 3d-model files
    cleanDirectory(path.join(uploadsDir, '3d-models'));
    
    // Clean up preview images
    cleanDirectory(path.join(uploadsDir, 'previews'));
    
    console.log('File storage cleanup completed');
  } catch (error) {
    console.error('Error during file storage cleanup:', error);
  }
}

function cleanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return;
  }
  
  console.log(`Cleaning directory: ${dirPath}`);
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    // Skip .gitkeep files and directories
    if (file === '.gitkeep') continue;
    
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
  }
}

// Run the reset function
resetDatabase()
  .then(() => {
    console.log('Reset process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Reset process failed:', error);
    process.exit(1);
  });