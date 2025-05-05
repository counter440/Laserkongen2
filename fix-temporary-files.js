require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixTemporaryFiles() {
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
    
    // Update all uploaded files to non-temporary
    console.log('Updating temporary files...');
    
    const [updateResult] = await pool.query(`
      UPDATE uploaded_files
      SET temporary = 0
      WHERE temporary = 1
    `);
    
    console.log(`Updated ${updateResult.affectedRows} files to non-temporary.`);
    
    // Check uploaded_files table
    console.log('\n=== UPLOADED FILES AFTER UPDATE ===');
    const [files] = await pool.query('SELECT * FROM uploaded_files');
    console.log(`Found ${files.length} uploaded files`);
    files.forEach(file => {
      console.log(`- File ID: ${file.id}, Name: ${file.original_name}, Order ID: ${file.order_id}, User ID: ${file.user_id}, Temporary: ${file.temporary ? 'Yes' : 'No'}`);
    });
    
    await pool.end();
    console.log('Done.');
  } catch (error) {
    console.error('Error fixing temporary files:', error);
  }
}

fixTemporaryFiles();