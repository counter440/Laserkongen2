const nodemailer = require('nodemailer');

async function testAdminNotification() {
  console.log('Testing admin notification system');
  try {
    // Import modules from app
    const Settings = require('./backend/models/Settings');
    await require('./backend/config/db').connectDB();
    
    console.log('Connected to database');

    // Get notification settings to verify they exist
    const notificationSettings = await Settings.getAllByCategory('notifications');
    console.log('Notification settings:', notificationSettings);
    
    // Get email settings from the app's Settings model
    const emailSettings = await Settings.getAllByCategory('email');

    console.log(`Found ${emailSettings.length} email settings`);

    // Convert to object format
    const emailConfig = {};
    emailSettings.forEach(setting => {
      emailConfig[setting.name] = setting.value;
    });

    console.log('Recipient email addresses:', emailConfig.contact_recipients);
    console.log('SMTP settings:', {
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_secure === 'true',
      user: emailConfig.smtp_user,
      from: emailConfig.smtp_from_email
    });

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

    console.log('Created email transporter, verifying connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Test email
    const mailOptions = {
      from: `"${emailConfig.smtp_from_name || 'Laserkongen'}" <${emailConfig.smtp_from_email}>`,
      to: emailConfig.contact_recipients,
      subject: 'Test Admin Notification',
      text: 'This is a test admin notification to verify email delivery.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
            <h1>Test Admin Notification</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>This is a test notification email to verify admin notifications are working.</p>
            <p>If you received this email, the system is set up correctly.</p>
          </div>
        </div>
      `
    };

    console.log('Sending test email to:', emailConfig.contact_recipients);
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!', info.messageId);

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminNotification();