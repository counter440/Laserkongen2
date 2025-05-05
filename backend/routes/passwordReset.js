const express = require('express');
const router = express.Router();
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../services/EmailService');
const bcrypt = require('bcryptjs');

// Request password reset
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'E-postadresse er påkrevd' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security reasons
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ 
        message: 'Hvis e-postadressen finnes i systemet, vil du motta en e-post med instruksjoner for å tilbakestille passordet.' 
      });
    }
    
    // Invalidate any existing tokens for this user
    await PasswordReset.invalidateTokensForUser(user.id);
    
    // Create new password reset token
    const resetToken = await PasswordReset.create(user.id);
    
    // Force the use of the real server IP regardless of environment variable
    const serverUrl = "http://194.32.107.238:3000";
    const resetUrl = `${serverUrl}/reset-password/${resetToken.token}`;
    
    console.log(`Created password reset URL: ${resetUrl}`);
    console.log(`FRONTEND_URL env variable: ${process.env.FRONTEND_URL || 'not set'}`);
    
    // Send password reset email
    const emailSubject = 'Tilbakestill passord - Laserkongen';
    const emailText = `
      Hei ${user.name},
      
      Vi har mottatt en forespørsel om å tilbakestille passordet ditt. 
      Klikk på lenken nedenfor for å tilbakestille passordet ditt:
      
      ${resetUrl}
      
      Denne lenken vil utløpe om 24 timer.
      
      Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.
      
      Vennlig hilsen,
      Laserkongen Team
    `;
    
    console.log('Plain text password reset URL:', resetUrl);
    
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
    
    const emailResult = await emailService.sendEmail(
      user.email,
      emailSubject,
      emailText,
      emailHtml
    );
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({ 
        message: 'Kunne ikke sende e-post. Vennligst prøv igjen senere.' 
      });
    }
    
    res.status(200).json({ 
      message: 'Hvis e-postadressen finnes i systemet, vil du motta en e-post med instruksjoner for å tilbakestille passordet.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'En feil oppstod. Vennligst prøv igjen senere.' });
  }
});

// Verify reset token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Ugyldig token' });
    }
    
    const resetToken = await PasswordReset.findByToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Ugyldig eller utløpt token. Vennligst be om en ny tilbakestillingslenke.' 
      });
    }
    
    res.status(200).json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'En feil oppstod. Vennligst prøv igjen senere.' 
    });
  }
});

// Reset password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        message: 'Token og nytt passord er påkrevd' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Passord må være minst 6 tegn langt' 
      });
    }
    
    const resetToken = await PasswordReset.findByToken(token);
    
    if (!resetToken) {
      return res.status(400).json({ 
        message: 'Ugyldig eller utløpt token. Vennligst be om en ny tilbakestillingslenke.' 
      });
    }
    
    // Find user
    const user = await User.findById(resetToken.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Bruker ikke funnet' });
    }
    
    // Update password using the User model's save mechanism to ensure correct hashing
    console.log('Password reset - setting password for user:', user.email);
    
    // Set the plain password and flag that it needs hashing
    user.password = password;
    user.isModifiedPassword = true;
    
    // Save will hash the password properly
    console.log('Password reset - calling user.save() to hash password');
    await user.save();
    
    console.log('Password reset - password updated successfully');
    
    // Mark token as used
    await resetToken.markAsUsed();
    
    // Invalidate any other tokens for this user
    await PasswordReset.invalidateTokensForUser(user.id);
    
    res.status(200).json({ 
      message: 'Passord tilbakestilt. Du kan nå logge inn med ditt nye passord.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'En feil oppstod. Vennligst prøv igjen senere.' 
    });
  }
});

module.exports = router;