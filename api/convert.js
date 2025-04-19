const express = require('express');
const app = express();

// Simplest possible health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is working',
    timestamp: new Date() 
  });
});

app.get('/api/convert', async (req, res) => {
  res.json({ message: 'PDF endpoint coming soon' });
});
// Fallback route
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    workingEndpoint: '/api/health'
  });
});

// Export without module.exports (Vercel-specific)
export default app;
