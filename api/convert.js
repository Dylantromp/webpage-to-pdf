const express = require('express');
const puppeteer = require('puppeteer');
const got = require('got');

const app = express();

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date(),
    pdfEndpoint: '/api/convert?url=https://example.com'
  });
});

// PDF Generation
app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    // Validate URL
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    console.log(`Processing: ${url}`);
    const startTime = Date.now();

    // Fetch HTML
    const { body: html } = await got(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      retry: { limit: 0 }
    });

    // Launch Browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      timeout: 15000
    });

    console.log(`Generated in ${(Date.now() - startTime)/1000}s`);
    res.type('application/pdf')
       .setHeader('Content-Disposition', 'attachment; filename=converted.pdf')
       .send(pdf);

  } catch (error) {
    console.error('Error:', error);
    const status = error.message.includes('timeout') ? 504 : 500;
    res.status(status).json({ 
      error: 'PDF generation failed',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = app;
