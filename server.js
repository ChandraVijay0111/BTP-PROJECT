const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const EMAILS_FILE = path.join(__dirname, 'emails.json');

const nodemailer = require('nodemailer');
require('dotenv').config();

app.post('/send-alert', async (req, res) => {
  try {
    // Load saved emails
    const data = fs.readFileSync(EMAILS_FILE, 'utf-8');
    const { emails } = JSON.parse(data);

    if (!emails || emails.length === 0) {
      return res.status(400).json({ message: 'No recipient emails configured.' });
    }

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails, // multiple recipients
      subject: 'Drowsiness Alert!',
      text: 'Drowsiness has been detected. Please take necessary action.'
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Alert email sent successfully!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
});


// Route to get saved emails
app.get('/get-emails', (req, res) => {
  if (fs.existsSync(EMAILS_FILE)) {
    const data = fs.readFileSync(EMAILS_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } else {
    res.json({ emails: [] });
  }
});

// Route to save emails
app.post('/save-emails', (req, res) => {
  const { emails } = req.body;
  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: 'Invalid format' });
  }

  fs.writeFileSync(EMAILS_FILE, JSON.stringify({ emails }, null, 2));
  res.json({ message: 'Emails saved successfully' });
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
