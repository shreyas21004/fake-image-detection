require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GOOGLE_API_KEY;

// Phishing Check Endpoint
app.get('/check-url', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Google Safe Browsing API Request
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`,
      {
        client: {
          clientId: "phishing-detector",
          clientVersion: "1.0"
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"], // Phishing = SOCIAL_ENGINEERING
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      }
    );

    // Check if URL is unsafe
    const isUnsafe = response.data.matches ? true : false;
    res.json({ isPhishing: isUnsafe });

  } catch (error) {
    console.error('Google API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to check URL' });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});