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

module.exports = app;
