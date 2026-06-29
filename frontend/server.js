const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000');
// Try multiple possible build locations
const possibleDirs = [
  path.join(__dirname, 'build'),
  path.join(process.cwd(), 'build'),
  '/app/build',
  '/app/frontend/build'
];

let buildDir = null;
for (const dir of possibleDirs) {
  if (fs.existsSync(path.join(dir, 'index.html'))) {
    buildDir = dir;
    break;
  }
}

if (!buildDir) {
  console.error('ERROR: Could not find build directory! Checked:', possibleDirs);
  buildDir = path.join(__dirname, 'build');
}

console.log('PORT:', PORT);
console.log('Build dir:', buildDir);

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let urlPath = (req.url || '/').split('?')[0];
  
  // Serve static files
  let filePath = path.join(buildDir, urlPath === '/' ? 'index.html' : urlPath);
  
  // If file doesn't exist, serve index.html (React Router fallback)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(buildDir, 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error: ' + err.code);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
