const express = require('express');
const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main PDF endpoint
app.get('/api/convert', (req, res) => {
  res.json({ message: 'PDF endpoint working!' });
});

// Fallback route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
