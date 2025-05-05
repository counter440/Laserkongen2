/**
 * This script directly resets a user's password in the MySQL database.
 * Usage: node reset-user-password.js youremail@example.com newpassword
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function resetPassword() {
  if (process.argv.length < 4) {
    console.error('Usage: node reset-user-password.js youremail@example.com newpassword');
    process.exit(1);
  }

  const email = process.argv[2];
  const newPassword = process.argv[3];

  console.log(`Attempting to reset password for user: ${email}`);
  
  try {
    // Create MySQL connection
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'laserkongen',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'laserkongen'
    });
    
    console.log('Connected to MySQL database');
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    if (result.affectedRows === 0) {
      console.error(`No user found with email: ${email}`);
      await connection.end();
      process.exit(1);
    }
    
    console.log(`Password successfully reset for ${email}`);
    console.log('You can now log in with the new password');
    
    await connection.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();