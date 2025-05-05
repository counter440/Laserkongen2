// Import required modules
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

// Create a direct admin notification function that doesn't depend on app code
async function sendAdminOrderNotification(orderId) {
  console.log(`===== DIRECT ADMIN NOTIFICATION SCRIPT - Order #${orderId} =====`);
  
  try {
    // Connect to the database directly
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'laserkongen',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'laserkongen'
    });
    
    console.log('Database connected successfully');
    
    // Get order details
    const [orderRows] = await connection.execute(
      `SELECT o.*, 
         osa.full_name AS customer_name, osa.email AS customer_email 
       FROM orders o
       LEFT JOIN order_shipping_address osa ON o.id = osa.order_id
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (orderRows.length === 0) {
      console.error(`Order #${orderId} not found`);
      connection.end();
      return { success: false, error: 'Order not found' };
    }
    
    const order = orderRows[0];
    console.log(`Found order #${orderId} for customer: ${order.customer_name || 'Unknown'}`);
    
    // Get email settings
    const [emailSettings] = await connection.execute(
      'SELECT * FROM settings WHERE category = ?',
      ['email']
    );
    
    // Convert to object format
    const emailConfig = {};
    emailSettings.forEach(setting => {
      emailConfig[setting.name] = setting.value;
    });
    
    console.log(`Using recipient email: ${emailConfig.contact_recipients}`);
    
    if (!emailConfig.contact_recipients || !emailConfig.contact_recipients.includes('@')) {
      console.error('No valid admin email addresses found in settings');
      connection.end();
      return { success: false, error: 'No valid admin email addresses' };
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: parseInt(emailConfig.smtp_port),
      secure: emailConfig.smtp_secure === 'true',
      auth: {
        user: emailConfig.smtp_user,
        pass: emailConfig.smtp_password
      }
    });
    
    console.log('Email transporter created');
    
    // Create email content
    const subject = `Ny ordre mottatt - #${order.id}`;
    const text = `En ny ordre har blitt mottatt på nettstedet.

Ordre #${order.id}
Kunde: ${order.customer_name || 'Ukjent'}
Sum: kr ${parseFloat(order.total_price || 0).toFixed(2)}

For å se full ordreinformasjon, logg inn på admin-dashbordet.`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
          <h1>Ny ordre mottatt!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>En ny ordre har blitt mottatt på nettstedet.</p>
          
          <h2>Ordreinformasjon</h2>
          <p><strong>Ordre #:</strong> ${order.id}</p>
          <p><strong>Kunde:</strong> ${order.customer_name || 'Ukjent'}</p>
          <p><strong>Sum:</strong> kr ${parseFloat(order.total_price || 0).toFixed(2)}</p>
          
          <p>For å se full ordreinformasjon, logg inn på admin-dashbordet.</p>
          <a href="/admin/orders" style="display: inline-block; background-color: #1e3a8a; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Se ordre</a>
        </div>
        <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
        </div>
      </div>
    `;
    
    // Send email
    console.log(`Sending admin notification email to: ${emailConfig.contact_recipients}`);
    const info = await transporter.sendMail({
      from: `"${emailConfig.smtp_from_name || 'Laserkongen'}" <${emailConfig.smtp_from_email}>`,
      to: emailConfig.contact_recipients,
      subject: subject,
      text: text,
      html: html
    });
    
    console.log(`Admin email sent successfully: ${info.messageId}`);
    connection.end();
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error in direct admin notification:', error);
    return { success: false, error: error.message };
  }
}

// Export for use in other files
module.exports = { sendAdminOrderNotification };

// If called directly, check for order ID argument
if (require.main === module) {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Please provide an order ID as argument');
    process.exit(1);
  }
  
  sendAdminOrderNotification(orderId)
    .then(result => {
      console.log('Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}