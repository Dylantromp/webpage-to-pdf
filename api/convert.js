const express = require('express');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Test endpoint - proves routing works
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Fallback for debugging
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    requestedUrl: req.url,
    availableEndpoints: ['/api/test']
  });
});

module.exports = app;
