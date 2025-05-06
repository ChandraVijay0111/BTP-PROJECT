const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use(express.static("public"));

require('dotenv').config();
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Email storage (simulated with a JSON file)
const emailFilePath = "./emails.json";

// Read the emails from the JSON file
function readEmails() {
  try {
    const emailsData = fs.readFileSync(emailFilePath);
    return JSON.parse(emailsData);
  } catch (err) {
    return [];
  }
}

// Write the emails to the JSON file
function saveEmails(emails) {
  fs.writeFileSync(emailFilePath, JSON.stringify(emails, null, 2));
}

// Fetch stored emails from the emails.json file
function getStoredEmails() {
    const filePath = path.join(__dirname, "emails.json");
    try {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data); // Parse the JSON data to an array of emails
    } catch (error) {
      console.error("Error reading the emails file:", error);
      return [];
    }
  }

// Route to get the list of emails
app.get("/emails", (req, res) => {
  const emails = readEmails();
  res.json(emails);
});

// Route to add a new email
app.post("/add-email", (req, res) => {
  const { email } = req.body;
  const emails = readEmails();

  // Check if email already exists
  if (emails.includes(email)) {
    return res.status(400).send("Email already exists.");
  }

  // Add new email
  emails.push(email);
  saveEmails(emails);
  res.send("Email added successfully.");
});

// Route to delete an email
app.delete("/emails", (req, res) => {
  const { email } = req.body;
  let emails = readEmails();

  // Remove the email from the list
  emails = emails.filter(existingEmail => existingEmail !== email);
  saveEmails(emails);
  res.send("Email deleted successfully.");
});

app.post("/send-email", (req, res) => {
  // Set defaults if not provided
  const subject = req.body.subject || "BTP ALERT";
  const text = req.body.text || "ALERT";

  const emails = getStoredEmails(); // Fetch emails from the emails.json file

  if (emails.length === 0) {
    return res.status(400).send("No email addresses found.");
  }

  // Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Track all email promises
  const emailPromises = emails.map((email) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
    };

    return transporter.sendMail(mailOptions)
      .then(info => {
        console.log(`Email sent to ${email}:`, info.response);
      })
      .catch(error => {
        console.error(`Error sending email to ${email}:`, error);
      });
  });

  // Send response after all emails processed
  Promise.allSettled(emailPromises).then(() => {
    res.send("Email(s) sent successfully.");
  });
});

  // === Existing endpoint: /send-email ===


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static('public'));

// const EMAILS_FILE = path.join(__dirname, 'emails.json');

// const nodemailer = require('nodemailer');
// require('dotenv').config();

// app.post('/send-alert', async (req, res) => {
//   try {
//     // Load saved emails
//     const data = fs.readFileSync(EMAILS_FILE, 'utf-8');
//     const { emails } = JSON.parse(data);

//     if (!emails || emails.length === 0) {
//       return res.status(400).json({ message: 'No recipient emails configured.' });
//     }

//     // Set up email transporter
//     const transporter = nodemailer.createTransport({
//       service: 'Gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });

//     // Email content
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: emails, // multiple recipients
//       subject: 'Drowsiness Alert!',
//       text: 'Drowsiness has been detected. Please take necessary action.'
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ message: 'Alert email sent successfully!' });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Failed to send email.' });
//   }
// });


// // Route to get saved emails
// app.get('/get-emails', (req, res) => {
//   if (fs.existsSync(EMAILS_FILE)) {
//     const data = fs.readFileSync(EMAILS_FILE, 'utf-8');
//     res.json(JSON.parse(data));
//   } else {
//     res.json({ emails: [] });
//   }
// });

// // Route to save emails
// app.post('/save-emails', (req, res) => {
//   const { emails } = req.body;
//   if (!emails || !Array.isArray(emails)) {
//     return res.status(400).json({ message: 'Invalid format' });
//   }

//   fs.writeFileSync(EMAILS_FILE, JSON.stringify({ emails }, null, 2));
//   res.json({ message: 'Emails saved successfully' });
// });

// app.listen(PORT, () => {
//   console.log(`Dashboard running at http://localhost:${PORT}`);
// });
