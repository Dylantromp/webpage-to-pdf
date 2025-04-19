const express = require('express');
const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'working',
    message: 'PDF conversion available at /api/convert'
  });
});

// PDF conversion endpoint
app.get('/api/convert', async (req, res) => {
  try {
    // This is a placeholder - we'll replace it with actual PDF generation
    res.json({
      message: "PDF generation will work after deployment",
      nextSteps: [
        "1. First verify this endpoint is reachable",
        "2. Then we'll add the PDF generation code"
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
