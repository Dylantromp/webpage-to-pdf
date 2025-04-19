const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
app.use(cors());

// Root endpoint - helps verify deployment
app.get('/', (req, res) => {
  res.json({
    service: 'Webpage to PDF Converter',
    endpoints: {
      convert: '/api/convert?url=[YOUR_URL]',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date() });
});

// Main PDF endpoint
app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Launch browser
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);

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
