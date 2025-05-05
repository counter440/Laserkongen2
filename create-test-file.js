require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createTestFile() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    console.log('Connecting to database...');
    
    // Create directories if they don't exist
    const modelDir = path.join(__dirname, 'uploads/3d-models');
    const previewDir = path.join(__dirname, 'uploads/previews');
    
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
      console.log(`Created directory: ${modelDir}`);
    }
    
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
      console.log(`Created directory: ${previewDir}`);
    }
    
    // Create a simple STL file
    const filename = `file-${Date.now()}-${Math.round(Math.random() * 1E9)}.stl`;
    const filePath = path.join(modelDir, filename);
    
    // Write a minimal STL file
    fs.writeFileSync(filePath, 'solid test\nendsolid test');
    console.log(`Created test STL file: ${filePath}`);
    
    // Create a preview image
    const previewFilename = `preview-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
    const previewPath = path.join(previewDir, previewFilename);
    
    // Create a simple colored square as PNG (20x20 pixels)
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    const c = createCanvas(200, 200);
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 200, 200);
    const buffer = c.toBuffer('image/png');
    fs.writeFileSync(previewPath, buffer);
    console.log(`Created preview image: ${previewPath}`);
    
    // Create a database record
    const fileUrl = `http://localhost:5001/uploads/3d-models/${filename}`;
    const previewUrl = `http://localhost:5001/uploads/previews/${previewFilename}`;
    
    const [result] = await pool.query(`
      INSERT INTO uploaded_files (
        original_name, filename, path, file_url, thumbnail_url,
        size, mimetype, file_type, processing_complete, status, temporary
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `, [
      'test-model.stl',
      filename,
      `uploads/3d-models/${filename}`,
      fileUrl,
      previewUrl,
      128,
      'application/vnd.ms-pki.stl',
      '3d-model',
      1,
      'processed',
      0 // Not temporary
    ]);
    
    const fileId = result.insertId;
    console.log(`Created database record with ID: ${fileId}`);
    
    // Add model data
    await pool.query(`
      INSERT INTO model_data (
        file_id, volume, weight, x, y, z, print_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      fileId,
      100,
      200,
      10,
      10,
      10,
      2
    ]);
    
    console.log(`Added model data for file ID: ${fileId}`);
    
    // Try to add an order and link the file
    const [orderResult] = await pool.query(`
      INSERT INTO orders (
        payment_method, items_price, tax_price, shipping_price, 
        total_price, status, created_at, updated_at
      ) VALUES (
        'stripe', 100, 25, 10, 
        135, 'pending', NOW(), NOW()
      )
    `);
    
    const orderId = orderResult.insertId;
    console.log(`Created test order with ID: ${orderId}`);
    
    // Add an order item
    const [itemResult] = await pool.query(`
      INSERT INTO order_items (
        order_id, product_id, name, quantity, price
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      orderId,
      null, // null product_id for custom items
      'Custom 3D Model',
      1,
      100
    ]);
    
    const itemId = itemResult.insertId;
    console.log(`Created order item with ID: ${itemId}`);
    
    // Add order custom options - check for valid type values from database
    await pool.query(`
      INSERT INTO order_custom_options (
        order_item_id, uploaded_file_id, material
      ) VALUES (?, ?, ?)
    `, [
      itemId,
      fileId,
      'PLA'
    ]);
    
    console.log(`Linked file to order through order_custom_options`);
    
    // Link the file to the order directly as well
    await pool.query(`
      UPDATE uploaded_files SET order_id = ? WHERE id = ?
    `, [orderId, fileId]);
    
    console.log(`Updated file record to link directly to order ID: ${orderId}`);
    
    // Verify the file exists and is properly linked
    const [fileCheck] = await pool.query(`
      SELECT uf.id, uf.original_name, uf.order_id, uf.temporary, uf.processing_complete,
             oco.id as option_id
      FROM uploaded_files uf
      LEFT JOIN order_custom_options oco ON oco.uploaded_file_id = uf.id
      WHERE uf.id = ?
    `, [fileId]);
    
    if (fileCheck.length > 0) {
      console.log('File verification:', {
        id: fileCheck[0].id,
        name: fileCheck[0].original_name,
        orderId: fileCheck[0].order_id,
        temporary: fileCheck[0].temporary ? 'Yes' : 'No',
        processed: fileCheck[0].processing_complete ? 'Yes' : 'No',
        hasCustomOption: fileCheck[0].option_id ? 'Yes' : 'No'
      });
    } else {
      console.error('File not found after creation!');
    }
    
    console.log('Test file creation completed successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating test file:', error);
  }
}

createTestFile();