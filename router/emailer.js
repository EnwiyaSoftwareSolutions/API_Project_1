require('dotenv').config();
const express = require('express');
const Router = express.Router();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logoPath = path.resolve(__dirname, '..', 'utils', 'imageBin', 'grayscale_transparent.png');

// Helper: basic HTML-escape to avoid injected HTML from user input
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Load email template once (use path relative to this file)
let template = '';
try {
  const templatePath = path.resolve(__dirname, '..', 'utils', 'index.html');
  template = fs.readFileSync(templatePath, 'utf8');
} catch (err) {
  console.warn('Email template not found or could not be read:', err.message);
  template = '<p>{{message}}</p><p>Phone: {{phone}}</p><p>From: {{from}}</p>';
}

// Build transporter using env vars (allow overriding host/port/secure)
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.G_USER,
    pass: process.env.G_PASS,
  },
});

// Optional: verify transporter on startup (non-blocking)
transporter.verify().then(() => {
  console.log('SMTP transporter verified');
}).catch((err) => {
  console.warn('SMTP transporter verification failed:', err.message);
});

Router.post('/send-email', async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body || {};

    // Basic validation
    if (!message || (!email && !name)) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: message and (email or name).' });
    }

    // Prepare substituted HTML from template (escape user content)
    const html = template
      .replace(/{{message}}/g, escapeHtml(message || ''))
      .replace(/{{phone}}/g, escapeHtml(phone || ''))
      .replace(/{{from}}/g, escapeHtml(email || name || ''))
      .replace(/{{subject}}/g, escapeHtml(subject || ''))
      .replace(/{{action_url}}/g, escapeHtml(process.env.ACTION_URL || '#'))
      .replace(/{{unsubscribe_url}}/g, escapeHtml(process.env.UNSUBSCRIBE_URL || '#'));

    const mailOptions = {
      from: `ESS, LLC <${process.env.G_USER}>`,
      to: process.env.G_USER,
      subject: subject ? escapeHtml(subject) : `Message from ${escapeHtml(name || email || 'Website visitor')}`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return res.status(200).json({ ok: true, message: 'Email sent', messageId: info.messageId });
  } catch (err) {
    console.error('Failed to send email:', err);
    // Provide a safe error message without leaking sensitive info
    return res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

module.exports = Router;