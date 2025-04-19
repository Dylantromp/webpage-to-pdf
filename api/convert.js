const express = require('express');
const got = require('got');
const pdf = require('html-pdf');
const { URL } = require('url');

const app = express();

// Middleware to validate URL
const validateUrl = (req, res, next) => {
  try {
    const url = new URL(req.query.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs allowed' });
    }
    next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
};

// PDF generation with robust error handling
app.get('/api/convert', validateUrl, async (req, res) => {
  let html;
  try {
    // 1. Fetch HTML with timeout
    const response = await got(req.query.url, {
      timeout: { request: 5000 }, // 5s timeout
      retry: { limit: 0 },
      headers: { 'User-Agent': 'Mozilla/5.0' } // Avoid bot blocks
    });
    html = response.body;
  } catch (fetchError) {
    console.error('Fetch failed:', fetchError.message);
    return res.status(502).json({ 
      error: 'Failed to fetch URL',
      details: fetchError.message 
    });
  }

  // 2. Generate PDF
  return new Promise((resolve) => {
    pdf.create(html, {
      format: 'A4',
      timeout: 10000, // 10s timeout
      border: '1cm',
      phantomPath: require('phantomjs-prebuilt').path // Required for Vercel
    }).toStream((err, stream) => {
      if (err) {
        console.error('PDF gen failed:', err);
        res.status(500).json({ 
          error: 'PDF generation failed',
          details: err.message 
        });
      } else {
        res.type('application/pdf');
        stream.pipe(res);
      }
      resolve();
    });
  });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
