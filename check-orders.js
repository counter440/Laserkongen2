require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkOrders() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    console.log('Checking orders and files...');
    
    // Get all orders
    const [orders] = await pool.query('SELECT * FROM orders');
    console.log(`Found ${orders.length} orders`);
    
    for (const order of orders) {
      console.log(`\nOrder ID: ${order.id}, Status: ${order.status}`);
      
      // Get order items
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      console.log(`  Order Items: ${items.length}`);
      
      for (const item of items) {
        console.log(`  - Item ID: ${item.id}, Product ID: ${item.product_id}, Name: ${item.name}`);
        
        // Check for custom options
        const [options] = await pool.query('SELECT * FROM order_custom_options WHERE order_item_id = ?', [item.id]);
        if (options.length > 0) {
          console.log(`    Custom Options: ${options.length}`);
          options.forEach(opt => {
            console.log(`    - Uploaded File ID: ${opt.uploaded_file_id}`);
          });
        }
      }
      
      // Check for files linked directly to the order
      const [files] = await pool.query('SELECT * FROM uploaded_files WHERE order_id = ?', [order.id]);
      console.log(`  Directly linked files: ${files.length}`);
      files.forEach(file => {
        console.log(`  - File ID: ${file.id}, Original Name: ${file.original_name}, Order ID: ${file.order_id}`);
      });
    }
    
    // Get all files
    console.log('\n\nAll Uploaded Files:');
    const [allFiles] = await pool.query('SELECT * FROM uploaded_files');
    console.log(`Total files: ${allFiles.length}`);
    allFiles.forEach(file => {
      console.log(`- File ID: ${file.id}, Original Name: ${file.original_name}, Order ID: ${file.order_id}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrders();
