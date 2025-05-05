require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixOrderAssociations() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    console.log('Starting to fix order-file associations...');
    
    // Test the connection
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Step 1: Find problematic order_custom_options entries
      // These are entries associated with standard shop products (non-null product_id)
      console.log('Looking for problematic order_custom_options entries...');
      const [badOptions] = await connection.query(`
        SELECT oco.id, oco.order_item_id, oco.uploaded_file_id, oi.product_id, oi.name
        FROM order_custom_options oco
        JOIN order_items oi ON oco.order_item_id = oi.id
        WHERE oi.product_id IS NOT NULL AND oi.product_id != 0
        AND oco.uploaded_file_id IS NOT NULL
      `);
      
      console.log(`Found ${badOptions.length} problematic entries`);
      
      // Log the problematic entries
      for (const option of badOptions) {
        console.log(`- Option ID: ${option.id}, Item ID: ${option.order_item_id}, Product ID: ${option.product_id}, Item Name: ${option.name}, File ID: ${option.uploaded_file_id}`);
      }
      
      // Step 2: Fix the problematic entries by removing the file association
      if (badOptions.length > 0) {
        console.log('Fixing problematic order_custom_options entries...');
        for (const option of badOptions) {
          await connection.query(`
            UPDATE order_custom_options 
            SET uploaded_file_id = NULL, file_url = NULL
            WHERE id = ?
          `, [option.id]);
          console.log(`- Fixed option ID: ${option.id}`);
        }
      }
      
      // Step 3: Find uploaded files incorrectly associated with orders
      console.log('Looking for incorrect file-order associations...');
      const [uploadedFiles] = await connection.query(`
        SELECT uf.id, uf.original_name, uf.order_id, oi.product_id
        FROM uploaded_files uf
        JOIN order_items oi ON oi.order_id = uf.order_id
        WHERE oi.product_id IS NOT NULL AND oi.product_id != 0
      `);
      
      console.log(`Found ${uploadedFiles.length} incorrectly associated files`);
      
      // Log the problematic files
      for (const file of uploadedFiles) {
        console.log(`- File ID: ${file.id}, Name: ${file.original_name}, Order ID: ${file.order_id}, Product ID: ${file.product_id}`);
      }
      
      // Step 4: Fix the problematic file associations
      if (uploadedFiles.length > 0) {
        console.log('Fixing problematic file-order associations...');
        for (const file of uploadedFiles) {
          // Find if this file should be associated with a different order
          const [correctOrder] = await connection.query(`
            SELECT oi.order_id
            FROM order_items oi
            JOIN order_custom_options oco ON oco.order_item_id = oi.id
            WHERE oco.uploaded_file_id = ? AND (oi.product_id IS NULL OR oi.product_id = 0)
          `, [file.id]);
          
          if (correctOrder.length > 0) {
            // Update with the correct order ID
            await connection.query(`
              UPDATE uploaded_files 
              SET order_id = ?
              WHERE id = ?
            `, [correctOrder[0].order_id, file.id]);
            console.log(`- Fixed file ID: ${file.id} - associated with order ID: ${correctOrder[0].order_id}`);
          } else {
            // If no correct order found, remove the association
            await connection.query(`
              UPDATE uploaded_files 
              SET order_id = NULL
              WHERE id = ?
            `, [file.id]);
            console.log(`- Fixed file ID: ${file.id} - removed order association`);
          }
        }
      }
      
      // Commit the changes
      await connection.commit();
      console.log('All fixes completed successfully');
      
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error('Error fixing order associations:', error);
      throw error;
    } finally {
      connection.release();
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Failed to fix order associations:', error);
    process.exit(1);
  }
}

// Run the fix function
fixOrderAssociations()
  .then(() => {
    console.log('Fix process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fix process failed:', error);
    process.exit(1);
  });