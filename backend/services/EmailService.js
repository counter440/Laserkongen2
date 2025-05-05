const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailSettings = null;
  }

  // Get freshly loaded email settings for each email - don't cache
  async getEmailSettings() {
    console.log('Getting fresh email settings from database');
    
    // Get email settings
    const settings = await Settings.getAllByCategory('email');
    
    // Convert array to object for easier handling
    const emailSettings = {};
    settings.forEach(setting => {
      emailSettings[setting.name] = setting.value;
    });
    
    // Check required settings
    const requiredSettings = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email'];
    for (const setting of requiredSettings) {
      if (!emailSettings[setting]) {
        throw new Error(`Missing required email setting: ${setting}`);
      }
    }
    
    return emailSettings;
  }

  // Get sender details formatted
  getSender(emailSettings) {
    return `"${emailSettings.smtp_from_name || 'Laserkongen'}" <${emailSettings.smtp_from_email}>`;
  }

  // Send email function - using same pattern as the working test email
  async sendEmail(to, subject, text, html) {
    try {
      console.log('========== EMAIL SENDING ATTEMPT ==========');
      console.log(`Sending email to: ${to}`);
      console.log(`Subject: ${subject}`);
      
      // Get fresh email settings every time
      const emailSettings = await this.getEmailSettings();
      
      console.log('Email configuration:');
      console.log(`  Host: ${emailSettings.smtp_host}`);
      console.log(`  Port: ${emailSettings.smtp_port}`);
      console.log(`  User: ${emailSettings.smtp_user}`);
      console.log(`  Secure: ${emailSettings.smtp_secure}`);
      console.log(`  From: ${emailSettings.smtp_from_name} <${emailSettings.smtp_from_email}>`);
      
      // Validate port is a number
      const port = parseInt(emailSettings.smtp_port);
      if (isNaN(port)) {
        throw new Error('SMTP port must be a number');
      }
      
      // Create a new transporter each time (don't reuse)
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
      
      console.log('Verifying SMTP connection...');
      
      try {
        // Verify SMTP connection configuration first
        await transporter.verify();
        console.log('SMTP configuration verified successfully');
      } catch (verifyError) {
        console.error('SMTP configuration error:', verifyError);
        throw new Error(`Failed to connect to SMTP server: ${verifyError.message}`);
      }
      
      // Prepare mail options
      const mailOptions = {
        from: this.getSender(emailSettings),
        to: to,
        subject: subject,
        text: text,
        html: html
      };
      
      // Send the email
      console.log('Sending email...');
      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully!');
      console.log(`  Message ID: ${info.messageId}`);
      console.log(`  Response: ${info.response}`);
      console.log('=========================================');
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      console.log('=========================================');
      return { success: false, error: error.message };
    }
  }

  // Check if admin notifications are enabled for a specific type
  async shouldNotifyAdmin(notificationType) {
    try {
      const settings = await Settings.getAllByCategory('notifications');
      
      // Find the setting with the specified name
      const setting = settings.find(s => s.name === notificationType);
      
      // If setting exists and is set to 'true', return true
      return setting ? setting.value === 'true' : true; // Default to true if setting doesn't exist
    } catch (error) {
      console.error(`Error checking notification setting ${notificationType}:`, error);
      return true; // Default to true on error
    }
  }
  
  // Send admin notification about new order
  async sendNewOrderNotification(order) {
    try {
      // Check if new order notifications are enabled
      const shouldNotify = await this.shouldNotifyAdmin('notify_new_order');
      if (!shouldNotify) {
        console.log('New order notifications are disabled. Skipping admin notification.');
        return { success: true, skipped: true };
      }
      
      console.log(`Preparing admin notification for new order #${order.id}`);
      
      // Get email settings
      const emailSettings = await this.getEmailSettings();
      
      // Check if we have admin recipient emails
      if (!emailSettings.contact_recipients || !emailSettings.contact_recipients.includes('@')) {
        console.error('Cannot send admin notification: No admin email addresses configured');
        return { success: false, error: 'No admin email addresses configured' };
      }
      
      const adminEmails = emailSettings.contact_recipients.trim();
      
      // Create email content
      const subject = `Ny ordre mottatt - #${order.id}`;
      const text = `En ny ordre har blitt mottatt på nettstedet.

Ordre #${order.id}
Kunde: ${order.shippingAddress ? order.shippingAddress.fullName : 'Ukjent'}
Sum: kr ${(typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : order.totalPrice).toFixed(2)}

For å se full ordreinformasjon, logg inn på admin-dashbordet.`;
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ny ordre mottatt</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #1e3a8a; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ny ordre mottatt!</h1>
    </div>
    <div class="content">
      <p>En ny ordre har blitt mottatt på nettstedet.</p>
      
      <h2>Ordreinformasjon</h2>
      <p><strong>Ordre #:</strong> ${order.id}</p>
      <p><strong>Kunde:</strong> ${order.shippingAddress ? order.shippingAddress.fullName : 'Ukjent'}</p>
      <p><strong>Sum:</strong> kr ${(typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : order.totalPrice).toFixed(2)}</p>
      
      <p>For å se full ordreinformasjon, logg inn på admin-dashbordet.</p>
      <a href="/admin/orders" class="button">Se ordre</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
    </div>
  </div>
</body>
</html>`;
      
      return await this.sendEmail(adminEmails, subject, text, html);
    } catch (error) {
      console.error('Error sending admin notification for new order:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order confirmation email
  async sendOrderConfirmation(order) {
    try {
      console.log(`Preparing order confirmation email for order #${order.id}`);
      
      // Make sure order has shipping address with email
      if (!order.shippingAddress || !order.shippingAddress.email) {
        console.error(`Cannot send confirmation: No email address available for order #${order.id}`);
        throw new Error('No email address available for order');
      }

      const { email, fullName } = order.shippingAddress;
      console.log(`Sending confirmation to: ${email} (${fullName})`);
      
      // Format order items
      const itemsList = order.orderItems.map(item => {
        // Make sure price is treated as a number
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
        
        return `<tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">kr ${price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">kr ${(price * quantity).toFixed(2)}</td>
        </tr>`;
      }).join('');
      
      // Create email content
      const subject = `Ordrebekreftelse - Bestillingsnr: #${order.id}`;
      const text = `Hei ${fullName || 'kunde'},
      
Takk for din bestilling hos Laserkongen!

Din bestilling #${order.id} er mottatt og vil bli behandlet så snart som mulig.

Bestillingsdetaljer:
----------------------------
${order.orderItems.map(item => {
  const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
  return `${item.name} x ${quantity} - kr ${price.toFixed(2)}`;
}).join('\n')}

Subtotal: kr ${(typeof order.itemsPrice === 'string' ? parseFloat(order.itemsPrice) : order.itemsPrice).toFixed(2)}
Moms: kr ${(typeof order.taxPrice === 'string' ? parseFloat(order.taxPrice) : order.taxPrice).toFixed(2)}
Frakt: kr ${(typeof order.shippingPrice === 'string' ? parseFloat(order.shippingPrice) : order.shippingPrice).toFixed(2)}
----------------------------
Totalt: kr ${(typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : order.totalPrice).toFixed(2)}

Leveringsadresse:
${fullName}
${order.shippingAddress.address}
${order.shippingAddress.postalCode} ${order.shippingAddress.city}
${order.shippingAddress.country}

Vi vil sende deg en oppdatering når bestillingen din er under behandling.

Vennlig hilsen,
Laserkongen Team`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ordrebekreftelse - Laserkongen</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f2f2f2; text-align: left; padding: 10px; }
    .total-row { font-weight: bold; }
    .address-box { background-color: white; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Takk for din bestilling!</h1>
    </div>
    <div class="content">
      <p>Hei ${fullName || 'kunde'},</p>
      
      <p>Vi har mottatt din bestilling og vil behandle den så snart som mulig.</p>
      
      <h2>Bestillingsdetaljer #${order.id}</h2>
      
      <table>
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Antall</th>
            <th>Pris</th>
            <th>Sum</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Subtotal:</strong></td>
            <td style="padding: 10px;">kr ${(typeof order.itemsPrice === 'string' ? parseFloat(order.itemsPrice) : order.itemsPrice).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Moms:</strong></td>
            <td style="padding: 10px;">kr ${(typeof order.taxPrice === 'string' ? parseFloat(order.taxPrice) : order.taxPrice).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Frakt:</strong></td>
            <td style="padding: 10px;">kr ${(typeof order.shippingPrice === 'string' ? parseFloat(order.shippingPrice) : order.shippingPrice).toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding: 10px;"><strong>Totalt:</strong></td>
            <td style="padding: 10px;">kr ${(typeof order.totalPrice === 'string' ? parseFloat(order.totalPrice) : order.totalPrice).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div class="address-box">
        <h3>Leveringsadresse:</h3>
        <p>${fullName}<br>
        ${order.shippingAddress.address}<br>
        ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
        ${order.shippingAddress.country}</p>
      </div>
      
      <p>Vi vil sende deg en oppdatering når bestillingen din er under behandling.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
    </div>
  </div>
</body>
</html>`;

      return await this.sendEmail(email, subject, text, html);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order status update email
  async sendOrderStatusUpdate(order, newStatus) {
    // Check if admin should be notified about order status changes
    try {
      const shouldNotifyAdmin = await this.shouldNotifyAdmin('notify_order_status');
      if (shouldNotifyAdmin) {
        console.log(`Sending admin notification for order #${order.id} status change to ${newStatus}`);
        
        // Get email settings
        const emailSettings = await this.getEmailSettings();
        
        // Check if we have admin recipient emails
        if (emailSettings.contact_recipients && emailSettings.contact_recipients.includes('@')) {
          const adminEmails = emailSettings.contact_recipients.trim();
          
          // Create email content
          const subject = `Ordrestatus endret - Ordre #${order.id} (${newStatus})`;
          const text = `Statusen på en ordre har blitt endret.\n\nOrdre #${order.id}\nNy status: ${newStatus}\nKunde: ${order.shippingAddress ? order.shippingAddress.fullName : 'Ukjent'}\n\nFor å se full ordreinformasjon, logg inn på admin-dashbordet.`;
          
          // Send the email to admin
          await this.sendEmail(adminEmails, subject, text, 
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
                <h1>Ordrestatus endret</h1>
              </div>
              <div style="padding: 20px; background-color: #f9f9f9;">
                <p>Statusen på en ordre har blitt endret.</p>
                <p><strong>Ordre #:</strong> ${order.id}</p>
                <p><strong>Ny status:</strong> ${newStatus}</p>
                <p><strong>Kunde:</strong> ${order.shippingAddress ? order.shippingAddress.fullName : 'Ukjent'}</p>
                <p>For å se full ordreinformasjon, logg inn på admin-dashbordet.</p>
                <a href="/admin/orders" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Se ordre</a>
              </div>
              <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
              </div>
            </div>`
          );
        }
      }
    } catch (error) {
      console.error('Error sending admin notification for order status change:', error);
      // Continue with customer notification regardless of admin notification failure
    }
    try {
      console.log(`Preparing ${newStatus} status email for order #${order.id}`);
      
      // Make sure order has shipping address with email
      if (!order.shippingAddress || !order.shippingAddress.email) {
        console.error(`Cannot send ${newStatus} email: No email address available for order #${order.id}`);
        throw new Error('No email address available for order');
      }

      const { email, fullName } = order.shippingAddress;
      console.log(`Sending ${newStatus} update to: ${email} (${fullName})`);
      
      // Define status-specific content
      let statusTitle, statusMessage;
      
      switch (newStatus) {
        case 'processing':
          statusTitle = 'Din bestilling er under behandling';
          statusMessage = 'Vi har begynt å behandle din bestilling. Du vil motta en ny oppdatering når bestillingen er sendt.';
          break;
        case 'shipped':
          statusTitle = 'Din bestilling er sendt';
          statusMessage = `Din bestilling er nå sendt${order.trackingNumber ? ` med sporingsnummer: ${order.trackingNumber}` : ''}. ${order.estimatedDeliveryDate ? `Forventet leveringsdato: ${new Date(order.estimatedDeliveryDate).toLocaleDateString('no-NO')}.` : ''}`;
          break;
        case 'delivered':
          statusTitle = 'Din bestilling er levert';
          statusMessage = 'Din bestilling skal nå være levert. Vi håper du er fornøyd med produktene våre!';
          break;
        default:
          statusTitle = 'Oppdatering på din bestilling';
          statusMessage = `Status på din bestilling er nå endret til: ${newStatus}`;
      }
      
      // Create email content
      const subject = `${statusTitle} - Bestillingsnr: #${order.id}`;
      const text = `Hei ${fullName || 'kunde'},
      
${statusMessage}

Bestillingsdetaljer #${order.id}:
----------------------------
${order.orderItems.map(item => {
  const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
  return `${item.name} x ${quantity}`;
}).join('\n')}

${newStatus === 'shipped' && order.trackingNumber ? `Sporingsnummer: ${order.trackingNumber}` : ''}
${newStatus === 'shipped' && order.estimatedDeliveryDate ? `Forventet leveringsdato: ${new Date(order.estimatedDeliveryDate).toLocaleDateString('no-NO')}` : ''}

Du kan se mer informasjon om din bestilling på din konto på nettstedet vårt.

Vennlig hilsen,
Laserkongen Team`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle} - Laserkongen</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .status-box { background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusTitle}</h1>
    </div>
    <div class="content">
      <p>Hei ${fullName || 'kunde'},</p>
      
      <div class="status-box">
        <p>${statusMessage}</p>
        ${newStatus === 'shipped' && order.trackingNumber ? `<p><strong>Sporingsnummer:</strong> ${order.trackingNumber}</p>` : ''}
        ${newStatus === 'shipped' && order.estimatedDeliveryDate ? `<p><strong>Forventet leveringsdato:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString('no-NO')}</p>` : ''}
      </div>
      
      <h2>Bestillingsdetaljer #${order.id}</h2>
      <ul>
        ${order.orderItems.map(item => {
          const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
          return `<li>${item.name} x ${quantity}</li>`;
        }).join('')}
      </ul>
      
      <p>Du kan se mer informasjon om din bestilling på din konto på nettstedet vårt.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
    </div>
  </div>
</body>
</html>`;

      return await this.sendEmail(email, subject, text, html);
    } catch (error) {
      console.error('Error sending order status update email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send welcome email for new user registration
  async sendWelcomeEmail(user) {
    try {
      console.log(`Preparing welcome email for user: ${user.email}`);
      
      if (!user.email) {
        console.error('Cannot send welcome email: No email address available for user');
        throw new Error('No email address available for user');
      }

      // Create email content
      const subject = 'Velkommen til Laserkongen';
      const text = `Hei ${user.name},
      
Takk for at du opprettet en konto hos Laserkongen!

Du kan nå logge inn på nettstedet vårt for å få tilgang til din konto, spore bestillinger, lagre adresser og mer.

Brukernavn: ${user.email}

Hvis du ikke opprettet denne kontoen, vennligst kontakt vår kundeservice.

Vennlig hilsen,
Laserkongen Team`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velkommen til Laserkongen</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Velkommen til Laserkongen!</h1>
    </div>
    <div class="content">
      <p>Hei ${user.name},</p>
      
      <p>Takk for at du opprettet en konto hos Laserkongen! Vi er glade for å ha deg som kunde.</p>
      
      <p>Du kan nå logge inn på nettstedet vårt for å få tilgang til din konto, spore bestillinger, lagre adresser og mer.</p>
      
      <p><strong>Brukernavn:</strong> ${user.email}</p>
      
      <p>Hvis du ikke opprettet denne kontoen, vennligst kontakt vår kundeservice.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Laserkongen. Alle rettigheter reservert.</p>
    </div>
  </div>
</body>
</html>`;

      return await this.sendEmail(user.email, subject, text, html);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create a singleton instance
const emailService = new EmailService();

module.exports = emailService;