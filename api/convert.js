const { chromium } = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Configuration for Vercel
const launchOptions = {
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
  ignoreHTTPSErrors: true,
};

app.get('/api/convert', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(pdf);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  }
});

module.exports = app;
