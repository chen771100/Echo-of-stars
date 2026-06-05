// 簡單開發伺服器
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  // 去掉快取版本號 (?v=xxx)
  filePath = filePath.replace(/\?v=\d+$/, '');
  if (filePath === './') filePath = './index.html';

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  // 禁止 JS/HTML/CSS 快取
  const noCache = ['.html', '.js', '.css'].includes(ext);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 - 找不到星靈碎片');
      return;
    }
    const headers = { 'Content-Type': contentType };
    if (noCache) {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
      headers['Pragma'] = 'no-cache';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌟 星靈迴響伺服器啟動！ http://0.0.0.0:${PORT}`);
});
