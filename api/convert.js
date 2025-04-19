const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
app.use(cors());

// Configure Chromium for Vercel
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;
args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox']

app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    // Validate URL
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Launch browser
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Load page with timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(pdf);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', pdfEndpoint: '/api/convert?url=[YOUR_URL]' });
});

module.exports = app;
