const fs = require('fs');
const path = require('path');
const { getPoolWithRetry } = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

async function createPasswordResetTable() {
  try {
    console.log('Connecting to database...');
    const pool = await getPoolWithRetry();
    
    console.log('Reading SQL script...');
    const sqlFile = path.join(__dirname, '..', 'create_password_reset_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Executing SQL script...');
    await pool.query(sql);
    
    console.log('Password reset table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating password reset table:', error);
    process.exit(1);
  }
}

createPasswordResetTable();