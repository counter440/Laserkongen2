/**
 * Test password reset email script
 * 
 * This script manually sends a password reset email with a guaranteed correct URL
 */
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Configuration
const EMAIL_TO_RESET = 'adrianalger@hotmail.com';
const SERVER_IP = '194.32.107.238';
const FRONTEND_PORT = '3000';

async function main() {
  try {
    console.log(`Password reset test for: ${EMAIL_TO_RESET}`);
    
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'laserkongen',
      password: 'password',
      database: 'laserkongen'
    });
    
    console.log('Connected to MySQL database');
    
    // Find the user
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [EMAIL_TO_RESET.toLowerCase()]
    );
    
    if (rows.length === 0) {
      console.error(`User not found with email: ${EMAIL_TO_RESET}`);
      await connection.end();
      process.exit(1);
    }
    
    const user = rows[0];
    console.log(`Found user: ${user.name} (ID: ${user.id})`);
    
    // Mark any existing password reset tokens as used
    await connection.execute(
      'UPDATE password_resets SET is_used = 1 WHERE user_id = ?',
      [user.id]
    );
    console.log('Invalidated any existing reset tokens');
    
    // Generate a new reset token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Insert the new token
    const [result] = await connection.execute(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );
    
    console.log(`Created new reset token: ${token.substring(0, 10)}...`);
    
    // Get email settings from database
    const [emailSettings] = await connection.execute(
      'SELECT * FROM settings WHERE category = "email"'
    );
    
    const emailConfig = {};
    emailSettings.forEach(setting => {
      emailConfig[setting.name] = setting.value;
    });
    
    console.log('Retrieved email settings from database');
    
    // Create reset URL with server IP
    const resetUrl = `http://${SERVER_IP}:${FRONTEND_PORT}/reset-password/${token}`;
    console.log(`Reset URL: ${resetUrl}`);
    
    // Configure email transport
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host || 'smtp.webhuset.no',
      port: parseInt(emailConfig.smtp_port || '465', 10),
      secure: emailConfig.smtp_secure === 'true',
      auth: {
        user: emailConfig.smtp_user || 'postmaster@laserkongen.no',
        pass: emailConfig.smtp_password || ''
      }
    });
    
    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tilbakestill passord - Laserkongen</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .expiry-note { font-size: 14px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tilbakestill passord</h1>
          </div>
          <div class="content">
            <p>Hei ${user.name},</p>
            
            <p>Vi har mottatt en forespørsel om å tilbakestille passordet ditt.</p>
            
            <p>Klikk på knappen nedenfor for å opprette et nytt passord:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Tilbakestill passord</a>
            </div>
            
            <p>Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:</p>
            <p style="background-color: #f0f0f0; padding: 10px; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p class="expiry-note">Denne lenken vil utløpe om 24 timer. Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send the email
    console.log('Sending email...');
    const info = await transporter.sendMail({
      from: `${emailConfig.smtp_from_name || 'Laserkongen'} <${emailConfig.smtp_from_email || 'postmaster@laserkongen.no'}>`,
      to: EMAIL_TO_RESET,
      subject: 'Tilbakestill passord - Laserkongen',
      text: `
        Hei ${user.name},
        
        Vi har mottatt en forespørsel om å tilbakestille passordet ditt. 
        Klikk på lenken nedenfor for å tilbakestille passordet ditt:
        
        ${resetUrl}
        
        Denne lenken vil utløpe om 24 timer.
        
        Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.
        
        Vennlig hilsen,
        Laserkongen Team
      `,
      html: emailHtml
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    await connection.end();
    console.log('Database connection closed');
    
    console.log('\nTo complete the password reset:');
    console.log(`1. Check your email at ${EMAIL_TO_RESET}`);
    console.log(`2. Open the link: ${resetUrl}`);
    console.log('3. Enter a new password');
    console.log('4. Try logging in with your new password');
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    process.exit(1);
  }
}

main();