require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugOrderFiles() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    console.log('Database connection successful');
    
    // Create a test file in uploaded_files table
    console.log('\n=== CREATING TEST FILE ===');
    const [fileResult] = await pool.query(`
      INSERT INTO uploaded_files 
      (original_name, filename, path, file_url, thumbnail_url, size, mimetype, file_type, temporary, processing_complete)
      VALUES 
      ('test_file.stl', 'test_file.stl', 'uploads/3d-models/test_file.stl', 
       'http://localhost:5001/uploads/3d-models/test_file.stl', 'http://localhost:5001/uploads/previews/test_preview.png',
       1024, 'application/octet-stream', '3d-model', 1, 1)
    `);
    
    const fileId = fileResult.insertId;
    console.log(`Created test file with ID: ${fileId}`);
    
    // Create a test order
    console.log('\n=== CREATING TEST ORDER ===');
    const [orderResult] = await pool.query(`
      INSERT INTO orders 
      (payment_method, items_price, tax_price, shipping_price, total_price, status, created_at, updated_at)
      VALUES 
      ('visa', 100, 25, 10, 135, 'pending', NOW(), NOW())
    `);
    
    const orderId = orderResult.insertId;
    console.log(`Created test order with ID: ${orderId}`);
    
    // Create a test order item (custom product)
    console.log('\n=== CREATING TEST ORDER ITEM (CUSTOM PRODUCT) ===');
    const [itemResult] = await pool.query(`
      INSERT INTO order_items 
      (order_id, product_id, name, quantity, price)
      VALUES 
      (?, NULL, 'Custom 3D Model', 1, 100)
    `, [orderId]);
    
    const itemId = itemResult.insertId;
    console.log(`Created test order item with ID: ${itemId}`);
    
    // Create order custom options
    console.log('\n=== CREATING ORDER CUSTOM OPTIONS ===');
    const [optionResult] = await pool.query(`
      INSERT INTO order_custom_options 
      (order_item_id, uploaded_file_id, type, material, color, quality)
      VALUES 
      (?, ?, '3d-print', 'PLA', 'White', 'High')
    `, [itemId, fileId]);
    
    console.log(`Created custom options with ID: ${optionResult.insertId}`);
    
    // Update the file to link it to the order
    console.log('\n=== LINKING FILE TO ORDER ===');
    const [updateResult] = await pool.query(`
      UPDATE uploaded_files 
      SET order_id = ?, temporary = 0, processing_complete = 1
      WHERE id = ?
    `, [orderId, fileId]);
    
    console.log(`Updated file: ${updateResult.affectedRows} row(s) affected`);
    
    // Verify everything was created correctly
    console.log('\n=== VERIFYING FILE-ORDER ASSOCIATION ===');
    
    // Check the file
    const [fileCheck] = await pool.query(`
      SELECT id, original_name, order_id, temporary, processing_complete 
      FROM uploaded_files 
      WHERE id = ?
    `, [fileId]);
    
    if (fileCheck.length > 0) {
      console.log('File details:', {
        id: fileCheck[0].id,
        name: fileCheck[0].original_name,
        orderId: fileCheck[0].order_id,
        temporary: fileCheck[0].temporary === 1 ? 'Yes' : 'No', 
        processed: fileCheck[0].processing_complete === 1 ? 'Yes' : 'No'
      });
    } else {
      console.error('File not found!');
    }
    
    // Check the order item
    const [itemCheck] = await pool.query(`
      SELECT id, order_id, product_id, name
      FROM order_items
      WHERE id = ?
    `, [itemId]);
    
    if (itemCheck.length > 0) {
      console.log('Order item details:', {
        id: itemCheck[0].id,
        orderId: itemCheck[0].order_id,
        productId: itemCheck[0].product_id,
        name: itemCheck[0].name
      });
    } else {
      console.error('Order item not found!');
    }
    
    // Check custom options
    const [optionsCheck] = await pool.query(`
      SELECT id, order_item_id, uploaded_file_id, type
      FROM order_custom_options
      WHERE order_item_id = ?
    `, [itemId]);
    
    if (optionsCheck.length > 0) {
      console.log('Custom options details:', {
        id: optionsCheck[0].id,
        orderItemId: optionsCheck[0].order_item_id,
        uploadedFileId: optionsCheck[0].uploaded_file_id,
        type: optionsCheck[0].type
      });
    } else {
      console.error('Custom options not found!');
    }
    
    // Simulate API call to get files for an order
    console.log('\n=== SIMULATING API CALL TO GET ORDER FILES ===');
    
    const [orderFiles] = await pool.query(`
      -- First, get files directly linked to the order
      SELECT * FROM uploaded_files
      WHERE order_id = ?
      
      UNION
      
      -- Then, get files linked through order_custom_options
      SELECT uf.* 
      FROM uploaded_files uf
      JOIN order_custom_options oco ON uf.id = oco.uploaded_file_id
      JOIN order_items oi ON oco.order_item_id = oi.id
      WHERE oi.order_id = ? AND uf.order_id IS NULL
    `, [orderId, orderId]);
    
    console.log(`API found ${orderFiles.length} files for order ID ${orderId}`);
    
    for (const file of orderFiles) {
      console.log('- File:', {
        id: file.id,
        name: file.original_name,
        orderId: file.order_id,
        temporary: file.temporary === 1 ? 'Yes' : 'No',
        processed: file.processing_complete === 1 ? 'Yes' : 'No'
      });
    }
    
    await pool.end();
    console.log('\nDebug complete');
  } catch (error) {
    console.error('Error:', error);
  }
}

debugOrderFiles();