const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
app.use(cors());

// Configure Chromium for Vercel
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Main PDF conversion endpoint
app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    // Validate URL
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`Starting PDF generation for: ${url}`);
    const startTime = Date.now();

    // Launch browser with timeout
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Set page load timeout (8 seconds)
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 8000
    });

    // Generate PDF with timeout (15 seconds max)
    const pdf = await Promise.race([
      page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 15000)
    ]);

    const generationTime = (Date.now() - startTime) / 1000;
    console.log(`PDF generated in ${generationTime}s`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=converted.pdf');
    res.send(pdf);

  } catch (error) {
    console.error('Error:', error);
    
    // Specific timeout handling
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      res.status(504).json({ 
        error: 'Processing timeout',
        message: 'The page took too long to load or convert'
      });
    } 
    // Puppeteer-specific errors
    else if (error.message.includes('Navigation failed')) {
      res.status(502).json({
        error: 'Page loading failed',
        message: 'The URL could not be loaded'
      });
    }
    // General errors
    else {
      res.status(500).json({ 
        error: 'PDF generation failed',
        details: error.message 
      });
    }
  } finally {
    // Close browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Webpage to PDF Converter',
    endpoints: {
      convert: '/api/convert?url=[YOUR_URL]',
      health: '/api/health'
    }
  });
});

module.exports = app;
