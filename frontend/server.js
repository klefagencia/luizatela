const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from build directory
const buildPath = path.join(__dirname, 'build');
console.log('PORT:', PORT);
console.log('Build path:', buildPath);

app.use(express.static(buildPath));

// For React Router - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
