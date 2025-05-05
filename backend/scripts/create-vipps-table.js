// Script to create Vipps payments table in database
const { getPool } = require('../config/db');

async function createVippsPaymentsTable() {
  try {
    const pool = getPool();
    if (!pool) {
      console.error('Database connection not available');
      return false;
    }

    const connection = await pool.getConnection();
    
    console.log('Creating vipps_payments table...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vipps_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        vipps_order_id VARCHAR(64),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NOK',
        status ENUM('pending', 'initiated', 'authorized', 'captured', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(20) DEFAULT 'vipps',
        error_message TEXT,
        redirect_url VARCHAR(255),
        transaction_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    
    console.log('vipps_payments table created or already exists');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vipps_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        enabled BOOLEAN DEFAULT false,
        test_mode BOOLEAN DEFAULT true,
        client_id VARCHAR(100),
        client_secret VARCHAR(100),
        subscription_key VARCHAR(100),
        merchant_serial_number VARCHAR(100),
        redirect_url VARCHAR(255),
        fallback_url VARCHAR(255),
        webhook_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('vipps_settings table created or already exists');
    
    // Check if default settings exist
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM vipps_settings');
    
    if (rows[0].count === 0) {
      // Insert default settings
      await connection.query(`
        INSERT INTO vipps_settings (
          enabled, test_mode, client_id, client_secret, 
          subscription_key, merchant_serial_number, 
          redirect_url, fallback_url, webhook_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          false, 
          true, 
          '', 
          '', 
          '', 
          '', 
          '/payment/success', 
          '/payment/cancel', 
          '/api/payments/vipps/webhook'
        ]
      );
      
      console.log('Default Vipps settings created');
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error creating Vipps tables:', error);
    return false;
  }
}

// Execute the function if run directly
if (require.main === module) {
  createVippsPaymentsTable()
    .then(result => {
      console.log(`Tables ${result ? 'created successfully' : 'creation failed'}`);
      process.exit(result ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
} else {
  // Export the function for use in other scripts
  module.exports = createVippsPaymentsTable;
}