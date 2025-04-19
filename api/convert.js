const express = require('express');
const puppeteer = require('puppeteer');
const got = require('got');

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Health Check (Simplest Possible)
app.get('/api/health', (req, res) => {
  console.log('Health check triggered');
  try {
    res.json({ 
      status: 'healthy',
      timestamp: new Date(),
      memoryUsage: process.memoryUsage()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ error: 'Health check failed', details: err.message });
  }
});

// PDF Generation with Step-by-Step Error Handling
app.get('/api/convert', async (req, res) => {
  const startTime = Date.now();
  let browser;
  let errorStep = 'initialization';

  try {
    // 1. Validate Input
    errorStep = 'input validation';
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    console.log(`Processing URL: ${url}`);

    // 2. Fetch HTML
    errorStep = 'HTML fetch';
    const htmlResponse = await got(url, {
      timeout: { request: 8000 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
      retry: 0
    });
    console.log('HTML fetched successfully');

    // 3. Launch Browser
    errorStep = 'browser launch';
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      timeout: 10000
    });
    console.log('Browser launched');

    // 4. Create Page
    errorStep = 'page creation';
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(15000);

    // 5. Set Content
    errorStep = 'content setting';
    await page.setContent(htmlResponse.body, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    console.log('Content set successfully');

    // 6. Generate PDF
    errorStep = 'PDF generation';
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      timeout: 15000
    });
    console.log(`PDF generated in ${Date.now() - startTime}ms`);

    // 7. Send Response
    errorStep = 'response sending';
    res.type('application/pdf')
       .setHeader('Content-Disposition', 'attachment; filename=converted.pdf')
       .send(pdf);

  } catch (error) {
    console.error(`Failed at step: ${errorStep}`, error);
    res.status(500).json({ 
      error: 'PDF generation failed',
      failedStep: errorStep,
      details: error.message,
      timestamp: new Date()
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed successfully');
      } catch (err) {
        console.error('Error closing browser:', err);
      }
    }
  }
});

module.exports = app;
