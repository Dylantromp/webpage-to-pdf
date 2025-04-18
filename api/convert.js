const express = require('express');
const got = require('got');
const pdf = require('html-pdf');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to validate URL
const validateUrl = (req, res, next) => {
  try {
    const url = new URL(req.query.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid URL format' });
  }
};

// PDF generation with fail-safe timeout
app.get('/api/convert', validateUrl, async (req, res) => {
  try {
    const url = req.query.url;
    
    // 1. Fetch HTML (with 8s timeout)
    const { body: html } = await got(url, {
      timeout: { request: 8000 },
      retry: { limit: 0 }
    });

    // 2. Generate PDF (with 15s timeout)
    const pdfOptions = {
      format: 'A4',
      timeout: 15000,
      border: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    };

    pdf.create(html, pdfOptions).toStream((err, stream) => {
      if (err) throw err;
      res.type('application/pdf');
      stream.pipe(res);
    });

  } catch (err) {
    console.error(`Error processing ${req.query.url}:`, err.message);
    res.status(500).json({ 
      error: 'Conversion failed',
      details: err.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
