const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify transporter config
    await transporter.verify((error, success) => {
      if (error) {
        console.error('Transporter verification failed:', error);
      } else {
        console.log('Transporter is ready');
      }
    });

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self
      subject: 'Nodemailer Test - Aurikrex Academy',
      text: 'If you receive this, nodemailer is working!',
      html: '<h1>Nodemailer Test</h1><p>If you see this, nodemailer is working!</p>'
    });

    console.log('Test email sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

testEmail();