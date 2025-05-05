require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkOrderCustomOptions() {
  try {
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    console.log('Examining order_custom_options:');
    
    const [options] = await pool.query(`
      SELECT 
        oco.id, 
        oco.order_item_id, 
        oco.uploaded_file_id, 
        oi.id as item_id, 
        oi.product_id, 
        oi.name as item_name, 
        o.id as order_id 
      FROM order_custom_options oco 
      JOIN order_items oi ON oco.order_item_id = oi.id 
      JOIN orders o ON oi.order_id = o.id
    `);
    
    console.log(`Found ${options.length} custom options`);
    
    options.forEach(opt => {
      console.log(`Option ID: ${opt.id}, Item ID: ${opt.item_id}, Order ID: ${opt.order_id}, Product ID: ${opt.product_id}, Item Name: ${opt.item_name}, File ID: ${opt.uploaded_file_id}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkOrderCustomOptions();