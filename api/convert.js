const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

// 1. First verify basic routing works
app.get('/api/test', (req, res) => {
  res.json({ message: "API is working!", status: 200 });
});

// 2. Then add PDF endpoint
app.get('/api/convert', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    const pdf = await page.pdf({ format: 'A4' });
    res.type('application/pdf').send(pdf);

    await browser.close();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Catch-all route for debugging
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    workingEndpoints: [
      '/api/test',
      '/api/convert?url=https://example.com'
    ]
  });
});

// 4. Vercel requires this export
module.exports = app;
