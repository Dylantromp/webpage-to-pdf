const express = require('express');
const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium-min');

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Add ?url=https://example.com to /api/convert'
  });
});

// PDF endpoint
app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Launch with Chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    res.type('application/pdf').send(pdf);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Conversion failed',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = app;
