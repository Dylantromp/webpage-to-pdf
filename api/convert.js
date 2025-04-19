const express = require('express');
const got = require('got');
const pdf = require('html-pdf');
const { URL } = require('url');
const phantomjs = require('phantomjs-prebuilt');

const app = express();

// Required for Vercel
process.env.PHANTOMJS_PATH = phantomjs.path;

app.get('/api/convert', async (req, res) => {
  try {
    // Validate URL
    const url = new URL(req.query.url);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    // Fetch HTML (5s timeout)
    const { body } = await got(url.toString(), {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    // Generate PDF (10s timeout)
    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(body, {
        format: 'A4',
        timeout: 10000,
        phantomPath: phantomjs.path
      }).toBuffer((err, buffer) => {
        err ? reject(err) : resolve(buffer);
      });
    });

    res.type('application/pdf').send(pdfBuffer);

  } catch (err) {
    console.error('Error:', err);
    const status = err.code === 'ENOTFOUND' ? 400 : 500;
    res.status(status).json({ 
      error: 'Conversion failed',
      details: err.message 
    });
  }
});

module.exports = app;
