const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pdfEndpoint: '/api/convert?url=https://example.com' });
});

// PDF conversion with minimal dependencies
app.get('/api/convert', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL parameter is required' });

  let browser;
  try {
    // 1. Launch browser with essential args only
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 2. Create page with basic settings
    const page = await browser.newPage();
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    // 3. Generate PDF with minimal options
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true
    });

    res.type('application/pdf').send(pdf);

  } catch (error) {
    console.error('PDF conversion failed:', error.message);
    res.status(500).json({ 
      error: 'Conversion failed',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = app;
