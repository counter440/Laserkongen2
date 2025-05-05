const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const Settings = require('../models/Settings');
const nodemailer = require('nodemailer');

// Get email settings
router.get('/email', authenticate, adminOnly, async (req, res) => {
  try {
    const settings = await Settings.getAllByCategory('email');
    
    // Convert array to object for easier handling
    const emailSettings = {};
    settings.forEach(setting => {
      emailSettings[setting.name] = setting.value;
    });
    
    res.status(200).json(emailSettings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update email settings
router.post('/email', authenticate, adminOnly, async (req, res) => {
  try {
    const {
      contact_recipients,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_from_email,
      smtp_from_name,
      smtp_secure
    } = req.body;
    
    // Update all settings
    const settings = {
      contact_recipients,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_from_email,
      smtp_from_name,
      smtp_secure
    };
    
    await Settings.setMultiple('email', settings);
    
    res.status(200).json({ message: 'Email settings updated successfully' });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test email settings
router.post('/email/test', authenticate, adminOnly, async (req, res) => {
  try {
    console.log('Test email request received from:', req.user.email);
    
    // Validate email address in request
    if (!req.body || !req.body.email) {
      return res.status(400).json({ message: 'Email address is required in request body' });
    }
    
    const testEmail = req.body.email.trim();
    
    // Validate that at least one email has @ symbol
    const emails = testEmail.split(',');
    let validEmails = false;
    for (const email of emails) {
      if (email.trim().includes('@')) {
        validEmails = true;
        break;
      }
    }
    
    if (!validEmails) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }
    
    console.log('Sending test email to:', testEmail);
    
    // Get email settings
    const settings = await Settings.getAllByCategory('email');
    
    // Convert array to object for easier handling
    const emailSettings = {};
    settings.forEach(setting => {
      emailSettings[setting.name] = setting.value;
    });
    
    // Check if all required settings are present
    const requiredSettings = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email'];
    for (const setting of requiredSettings) {
      if (!emailSettings[setting]) {
        return res.status(400).json({ message: `Missing required email setting: ${setting}` });
      }
    }
    
    // Validate port is a number
    const port = parseInt(emailSettings.smtp_port);
    if (isNaN(port)) {
      return res.status(400).json({ message: 'SMTP port must be a number' });
    }
    
    // Create nodemailer transporter with timeout
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: port,
      secure: emailSettings.smtp_secure === 'true',
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    
    // Verify SMTP connection configuration first
    try {
      await transporter.verify();
      console.log('SMTP configuration verified successfully');
    } catch (verifyError) {
      console.error('SMTP configuration error:', verifyError);
      return res.status(400).json({ 
        message: 'Failed to connect to SMTP server. Please check your settings.',
        error: verifyError.message 
      });
    }
    
    // Prepare mail options
    const mailOptions = {
      from: `"${emailSettings.smtp_from_name || 'Laserkongen'}" <${emailSettings.smtp_from_email}>`,
      to: testEmail,
      subject: 'Test Email fra Laserkongen',
      text: 'Dette er en test e-post fra Laserkongen for å bekrefte at e-postinnstillingene fungerer.',
      html: '<p>Dette er en test e-post fra Laserkongen for å bekrefte at e-postinnstillingene fungerer.</p>'
    };
    
    // Send the test email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Test email sent successfully:', info.messageId);
      res.status(200).json({ 
        message: 'Test email sent successfully', 
        info: {
          messageId: info.messageId,
          response: info.response
        }
      });
    } catch (sendError) {
      console.error('Error sending test email:', sendError);
      res.status(500).json({ 
        message: 'Failed to send test email. Please check your email settings.', 
        error: sendError.message 
      });
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({ message: 'Server error processing test email request', error: error.message });
  }
});

// Get notification settings
router.get('/notifications', authenticate, adminOnly, async (req, res) => {
  try {
    const settings = await Settings.getAllByCategory('notifications');
    
    // Convert array to object for easier handling
    const notificationSettings = {
      notify_new_order: 'true',
      notify_order_status: 'true',
      notify_contact_form: 'true'
    };
    
    settings.forEach(setting => {
      notificationSettings[setting.name] = setting.value;
    });
    
    res.status(200).json(notificationSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update notification settings
router.post('/notifications', authenticate, adminOnly, async (req, res) => {
  try {
    const {
      notify_new_order,
      notify_order_status,
      notify_contact_form
    } = req.body;
    
    // Update all settings
    const settings = {
      notify_new_order,
      notify_order_status,
      notify_contact_form
    };
    
    await Settings.setMultiple('notifications', settings);
    
    res.status(200).json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get site settings
router.get('/site', authenticate, adminOnly, async (req, res) => {
  try {
    const settings = await Settings.getAllByCategory('site');
    
    // Convert array to object for easier handling
    const siteSettings = {};
    settings.forEach(setting => {
      siteSettings[setting.name] = setting.value;
    });
    
    res.status(200).json(siteSettings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update site settings
router.post('/site', authenticate, adminOnly, async (req, res) => {
  try {
    // Update all settings
    await Settings.setMultiple('site', req.body);
    
    res.status(200).json({ message: 'Site settings updated successfully' });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;