const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,   // e.g. Gmail, Outlook, etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false           // ✅ ignore self-signed certificate errors
      }
    });
  }

  async sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Women Healthcare Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">Welcome to Women Healthcare Portal</h2>
          <p>Please verify your email address to complete your registration.</p>
          <a href="${verificationUrl}" 
             style="background-color: #4a90e2; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendTwoFactorEmail(email, token) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Two-Factor Authentication Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">Two-Factor Authentication</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4a90e2; font-size: 32px; letter-spacing: 8px;">${token}</h1>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
