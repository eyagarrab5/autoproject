const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('Initializing email service with:', {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 5)}...` : 'NOT SET',
      passwordSet: !!process.env.EMAIL_PASSWORD
    });
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Calculate expiration time in GMT+1 (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const expiresAtGMTPlus1 = expiresAt.toLocaleString('fr-FR', { 
      timeZone: 'Europe/Paris',
      dateStyle: 'short',
      timeStyle: 'medium'
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Your App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: this.getPasswordResetTemplate(userName, resetUrl, resetToken, expiresAtGMTPlus1)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error.message);
      console.error('Full error:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  // Send password reset confirmation email
  async sendPasswordResetConfirmation(email, userName) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Your App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Successful',
      html: this.getPasswordResetConfirmationTemplate(userName)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset confirmation email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw error for confirmation email
      return { success: false, error: error.message };
    }
  }

  // Password reset email template
  getPasswordResetTemplate(userName, resetUrl, resetToken, expiresAt) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .code-box { background-color: #f4f4f4; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 2px; }
          .expiry-box { background-color: #e3f2fd; border: 1px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
            
            <div class="expiry-box">
              <strong>⏰ Token Expiration:</strong><br>
              <span style="font-size: 16px; color: #1976D2;">${expiresAt} (GMT+1)</span>
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in <strong>30 minutes</strong></li>
                <li>The link can only be used once</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p><strong>Reset Token:</strong></p>
            <div class="code-box">${resetToken}</div>
            
            <p>If the button doesn't work, you can also use the reset token above in the password reset form.</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Password reset confirmation template
  getPasswordResetConfirmationTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 5px; color: #155724; }
          .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Password Reset Successful</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div class="success">
              <strong>✓ Your password has been successfully reset!</strong>
            </div>
            
            <p>This is a confirmation that the password for your account has just been changed.</p>
            
            <p>You can now log in with your new password.</p>
            
            <div class="alert">
              <strong>⚠️ Did you make this change?</strong>
              <p>If you did not make this change, please contact our support team immediately as your account may be compromised.</p>
            </div>
            
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Never share your password with anyone</li>
              <li>Enable two-factor authentication if available</li>
              <li>Regularly update your password</li>
            </ul>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
