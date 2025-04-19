const express = require('express');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'API is working!' });
});

// PDF conversion endpoint
app.get('/api/convert', (req, res) => {
  res.json({ 
    message: 'PDF endpoint is reachable',
    usage: 'Add ?url=https://example.com' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
