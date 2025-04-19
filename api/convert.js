const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
app.use(cors());

// Configure Chromium
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
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

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '2.0.0' });
});

module.exports = app;
