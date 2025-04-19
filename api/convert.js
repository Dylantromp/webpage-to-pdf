const express = require('express');
const puppeteer = require('puppeteer');
const got = require('got');

const app = express();

app.get('/api/convert', async (req, res) => {
  let browser;
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const { body: html } = await got(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true
    });

    res.type('application/pdf').send(pdf);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

module.exports = app;
