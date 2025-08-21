import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    port: process.env.SMTP_PORT  || 465, // default port for secure SMTP
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendResetEmail = async (email, resetCode) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Password Reset Code',
    html: `
      <h2>Password Reset</h2>
      <p>Your password reset code is: <strong>${resetCode}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.log('Email error:', error);
    return false;
  }
};
