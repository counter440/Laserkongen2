const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const ContactForm = require('../models/ContactForm');
const Settings = require('../models/Settings');
const nodemailer = require('nodemailer');
const emailService = require('../services/EmailService');

// Get all contact form submissions (admin only)
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await ContactForm.getAll(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching contact forms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific contact form submission (admin only)
router.get('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const form = await ContactForm.getById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ message: 'Contact form not found' });
    }
    
    res.status(200).json(form);
  } catch (error) {
    console.error('Error fetching contact form:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new contact form submission (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Please provide name, email, and message' });
    }
    
    // Get email settings
    const settings = await Settings.getAllByCategory('email');
    
    // Convert array to object for easier handling
    const emailSettings = {};
    settings.forEach(setting => {
      emailSettings[setting.name] = setting.value;
    });
    
    // Check if all required settings are present
    const requiredSettings = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email', 'contact_recipients'];
    for (const setting of requiredSettings) {
      if (!emailSettings[setting]) {
        return res.status(500).json({ message: `Server email configuration error: Missing ${setting}` });
      }
    }
    
    // Create contact form in database
    const contactForm = await ContactForm.create({
      name,
      email,
      subject,
      message
    });
    
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: parseInt(emailSettings.smtp_port),
      secure: emailSettings.smtp_secure === 'true',
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password
      }
    });
    
    // Prepare email content
    const mailOptions = {
      from: `"${emailSettings.smtp_from_name || 'Laserkongen'}" <${emailSettings.smtp_from_email}>`,
      to: emailSettings.contact_recipients,
      subject: `Kontaktskjema: ${subject || 'Ingen emne'}`,
      text: `Navn: ${name}\nE-post: ${email}\n\nMelding:\n${message}`,
      html: `
        <h2>Ny melding fra kontaktskjema</h2>
        <p><strong>Navn:</strong> ${name}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Emne:</strong> ${subject || 'Ingen emne'}</p>
        <p><strong>Melding:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };
    
    // Check if admin notifications are enabled for contact forms
    const notificationSettings = await require('../models/Settings').getAllByCategory('notifications');
    const shouldNotifyAdmin = notificationSettings.find(s => s.name === 'notify_contact_form')?.value === 'true';
    
    if (shouldNotifyAdmin) {
      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Contact form notification email sent to admin');
    } else {
      console.log('Admin notifications for contact forms are disabled. Skipping notification.');
    }
    
    res.status(201).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Error submitting contact form', error: error.message });
  }
});

// Update contact form status (admin only)
router.patch('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Please provide a status' });
    }
    
    const form = await ContactForm.updateStatus(req.params.id, status);
    
    if (!form) {
      return res.status(404).json({ message: 'Contact form not found' });
    }
    
    res.status(200).json(form);
  } catch (error) {
    console.error('Error updating contact form status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a contact form (admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const deleted = await ContactForm.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Contact form not found' });
    }
    
    res.status(200).json({ message: 'Contact form deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact form:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;