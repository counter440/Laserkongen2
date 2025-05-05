const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

async function testEmail() {
  try {
    console.log('Testing email functionality...');
    
    // Connect to the database
    const pool = await mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'laserkongen',
      password: process.env.MYSQL_PASSWORD || 'password',
      database: process.env.MYSQL_DATABASE || 'laserkongen',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    console.log('Connected to database');
    
    // Get email settings
    const [settings] = await pool.query('SELECT * FROM settings WHERE category = "email"');
    console.log('Retrieved settings from database:', settings.length);
    
    // Convert array to object for easier handling
    const emailSettings = {};
    settings.forEach(setting => {
      emailSettings[setting.name] = setting.value;
    });
    
    console.log('Email configuration:');
    console.log('  Host:', emailSettings.smtp_host);
    console.log('  Port:', emailSettings.smtp_port);
    console.log('  User:', emailSettings.smtp_user);
    console.log('  Secure:', emailSettings.smtp_secure);
    console.log('  From:', `${emailSettings.smtp_from_name} <${emailSettings.smtp_from_email}>`);
    console.log('  Recipients:', emailSettings.contact_recipients);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: parseInt(emailSettings.smtp_port),
      secure: emailSettings.smtp_secure === 'true',
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password
      },
      debug: true, // Enable debugging
      logger: true // Log to console
    });
    
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    // Send test email
    const mailOptions = {
      from: `"${emailSettings.smtp_from_name}" <${emailSettings.smtp_from_email}>`,
      to: emailSettings.contact_recipients,
      subject: 'Test Email from Laserkongen',
      text: 'This is a test email to verify that email sending works correctly.',
      html: '<p>This is a test email to verify that email sending works correctly.</p>'
    };
    
    console.log('Sending test email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully!');
    console.log('  Message ID:', info.messageId);
    console.log('  Response:', info.response);
    
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error testing email:', error);
  }
}

testEmail();