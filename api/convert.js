const express = require('express');
const puppeteer = require('puppeteer');
const got = require('got');

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // 1. Fetch HTML content first (5s timeout)
    const { body: html } = await got(url, {
      timeout: { request: 5000 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    // 2. Generate PDF (15s timeout)
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

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
    const statusCode = error.message.includes('timeout') ? 504 : 500;
    res.status(statusCode).json({ 
      error: 'PDF generation failed',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    version: '4.0.0',
    usage: '/api/convert?url=https://example.com' 
  });
});

module.exports = app;
