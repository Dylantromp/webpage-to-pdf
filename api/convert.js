const express = require('express');
const puppeteer = require('puppeteer');
const got = require('got');

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'PDF converter is running',
    usage: 'Use /api/convert?url=YOUR_URL'
  });
});

// Main PDF conversion endpoint
app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Fetch HTML content first
    const { body: html } = await got(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    res.type('application/pdf')
       .setHeader('Content-Disposition', 'attachment; filename=converted.pdf')
       .send(pdf);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'PDF generation failed',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

// Catch-all route for debugging
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      '/api/health',
      '/api/convert?url=YOUR_URL'
    ]
  });
});

module.exports = app;
