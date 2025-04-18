const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium'); 

const app = express();

// Configure Chromium
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL required' });

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    
    const pdf = await page.pdf({ format: 'A4' });
    res.type('application/pdf').send(pdf);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});
// Add this before module.exports
app.get('/', (req, res) => {
  res.send('PDF API is running! Try /api/convert?url=[your-url]');
});

// Add timeout handling
await page.goto(url, {
  waitUntil: 'domcontentloaded', // Faster than 'networkidle2'
  timeout: 8000 // Fail fast if page won't load
});

// Simplify PDF generation
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
});
module.exports = app;
