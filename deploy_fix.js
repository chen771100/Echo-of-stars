const { Client } = require('/home/node/.openclaw/workspace/node_modules/ssh2');
const fs = require('fs');

const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>星靈迴響：Nana & 布布</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0a1a;display:flex;justify-content:center;align-items:center;min-height:100vh;overflow:hidden}
    #game-container{border:2px solid #6b2fa0;box-shadow:0 0 30px rgba(107,47,160,0.4)}
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>
  <script src="js/main.js"></script>
</body>
</html>`;

const b64 = Buffer.from(html).toString('base64');
const conn = new Client();

conn.on('ready', () => {
  // Write file directly - use temp file approach to avoid shell escaping issues
  conn.exec(`python3 << 'PYEOF'
import base64
open('/home/james670818/echo-of-stars/index.html','w').write(base64.b64decode('${b64}').decode())
print('WRITE_OK')
PYEOF`, (e, s) => {
    let o = '';
    s.on('data', d => o += d.toString());
    s.on('close', code => {
      console.log('Write:', o.trim(), 'exit:', code);
      
      if (o.includes('WRITE_OK')) {
        // Verify
        conn.exec('head -c 300 /home/james670818/echo-of-stars/index.html', (e2, s2) => {
          let o2 = '';
          s2.on('data', d => o2 += d.toString());
          s2.on('close', () => {
            console.log('Content:', o2.trim());
            
            // Check for CDN URL
            if (o2.includes('cdn.jsdelivr.net')) {
              console.log('✅ CDN URL found!');
              
              // Restart server
              conn.exec(`
                kill $(lsof -t -i:3000) 2>/dev/null
                cd ~/echo-of-stars && nohup node server.js > /tmp/eos.log 2>&1 &
                sleep 2
                curl -s -o /dev/null -w "HTTP:%{http_code}" http://localhost:3000/
              `, (e3, s3) => {
                let o3 = '';
                s3.on('data', d => o3 += d.toString());
                s3.on('close', () => {
                  console.log('Server:', o3.trim());
                  console.log('🎮 http://192.168.50.201:3000');
                  conn.end();
                });
              });
            } else {
              console.log('❌ CDN URL missing. Trying alternative write...');
              // Try different approach
              conn.exec(`cat > /home/james670818/echo-of-stars/index.html << 'ENDOFFILE'
${html}
ENDOFFILE
echo "CAT_OK"`, (e4, s4) => {
                let o4 = '';
                s4.on('data', d => o4 += d.toString());
                s4.on('close', () => {
                  console.log('Cat write:', o4.trim());
                  conn.exec('head -c 300 ~/echo-of-stars/index.html', (e5, s5) => {
                    let o5 = '';
                    s5.on('data', d => o5 += d.toString());
                    s5.on('close', () => {
                      console.log('Content:', o5.trim());
                      if (o5.includes('cdn')) console.log('✅ CDN fixed!');
                      else console.log('❌ Still not fixed');
                      conn.end();
                    });
                  });
                });
              });
            }
          });
        });
      }
    });
  });
});

conn.on('error', e => console.log('ERR:', e.message));
conn.connect({
  host: '192.168.50.201',
  port: 22,
  username: 'james670818',
  privateKey: fs.readFileSync('/home/node/.openclaw/workspace/.ssh-backup/id_ed25519'),
  readyTimeout: 10000
});
