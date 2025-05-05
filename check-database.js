require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    console.log('Connection successful to database:', process.env.MYSQL_DATABASE);
    
    // Check uploaded_files table
    console.log('\n=== UPLOADED FILES ===');
    const [files] = await pool.query('SELECT * FROM uploaded_files');
    console.log(`Found ${files.length} uploaded files`);
    files.forEach(file => {
      console.log(`- File ID: ${file.id}, Name: ${file.original_name}, Order ID: ${file.order_id}, User ID: ${file.user_id}, Temporary: ${file.temporary ? 'Yes' : 'No'}`);
    });
    
    // Check orders
    console.log('\n=== ORDERS ===');
    const [orders] = await pool.query('SELECT * FROM orders');
    console.log(`Found ${orders.length} orders`);
    orders.forEach(order => {
      console.log(`- Order ID: ${order.id}, Status: ${order.status}, User ID: ${order.user_id}`);
    });
    
    // Check order items
    console.log('\n=== ORDER ITEMS ===');
    const [items] = await pool.query('SELECT * FROM order_items');
    console.log(`Found ${items.length} order items`);
    items.forEach(item => {
      console.log(`- Item ID: ${item.id}, Order ID: ${item.order_id}, Product ID: ${item.product_id}, Name: ${item.name}`);
    });
    
    // Check order custom options
    console.log('\n=== ORDER CUSTOM OPTIONS ===');
    const [options] = await pool.query('SELECT * FROM order_custom_options');
    console.log(`Found ${options.length} custom options`);
    options.forEach(option => {
      console.log(`- Option ID: ${option.id}, Item ID: ${option.order_item_id}, File ID: ${option.uploaded_file_id}`);
    });
    
    // Check for inconsistencies
    console.log('\n=== CHECKING ASSOCIATIONS ===');
    
    // Files with order_id but no matching entry in order_custom_options
    const [unlinkedFiles] = await pool.query(`
      SELECT uf.id, uf.original_name, uf.order_id 
      FROM uploaded_files uf
      LEFT JOIN order_custom_options oco ON oco.uploaded_file_id = uf.id
      WHERE uf.order_id IS NOT NULL AND oco.id IS NULL
    `);
    console.log(`Files with order_id but no entry in order_custom_options: ${unlinkedFiles.length}`);
    unlinkedFiles.forEach(file => {
      console.log(`- Unlinked File ID: ${file.id}, Name: ${file.original_name}, Order ID: ${file.order_id}`);
    });
    
    // Custom options with file_id but no matching entry in uploaded_files
    const [orphanedOptions] = await pool.query(`
      SELECT oco.id, oco.order_item_id, oco.uploaded_file_id
      FROM order_custom_options oco
      LEFT JOIN uploaded_files uf ON uf.id = oco.uploaded_file_id
      WHERE oco.uploaded_file_id IS NOT NULL AND uf.id IS NULL
    `);
    console.log(`Custom options with file_id but no matching file: ${orphanedOptions.length}`);
    orphanedOptions.forEach(option => {
      console.log(`- Orphaned Option ID: ${option.id}, Item ID: ${option.order_item_id}, Missing File ID: ${option.uploaded_file_id}`);
    });
    
    // Check the upload to order process
    console.log('\n=== CHECKING FILE-ORDER RELATIONS ===');
    const [fileOrderRelations] = await pool.query(`
      SELECT 
        uf.id AS file_id, 
        uf.original_name, 
        uf.order_id,
        oi.id AS item_id,
        oi.product_id,
        oi.name AS item_name,
        oco.id AS option_id
      FROM uploaded_files uf
      LEFT JOIN order_custom_options oco ON oco.uploaded_file_id = uf.id
      LEFT JOIN order_items oi ON oco.order_item_id = oi.id
    `);
    
    console.log(`File-order relations: ${fileOrderRelations.length}`);
    fileOrderRelations.forEach(relation => {
      console.log(`- File ID: ${relation.file_id}, Name: ${relation.original_name}, Order ID: ${relation.order_id}, Item ID: ${relation.item_id}, Product ID: ${relation.product_id}, Item Name: ${relation.item_name}, Option ID: ${relation.option_id}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();