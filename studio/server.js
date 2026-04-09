// EDS Server — serves app + studio from one port for same-origin localStorage access
// Usage: node studio/server.js [project-name] [port]
// Example: node studio/server.js early-bird 8094

const http = require('http');
const fs = require('fs');
const path = require('path');

const projectName = process.argv[2] || 'early-bird';
const PORT = parseInt(process.argv[3]) || 8094;
const edsRoot = path.resolve(__dirname, '..');
const studioRoot = __dirname;
const configPath = path.join(edsRoot, 'projects', `${projectName}.json`);

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error(`Cannot read project config: ${configPath}\n${e.message}`);
  process.exit(1);
}

const appRoot = path.resolve(config.appRoot);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.webp': 'image/webp', '.mp4': 'video/mp4',
};

const WRITE_EXTS = ['.css', '.html', '.json'];

function serve(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = req.url.split('?')[0];

  // ── Write endpoint ──
  if (req.method === 'POST' && url === '/write') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { projectRoot, file, content } = JSON.parse(body);
        const ext = path.extname(file).toLowerCase();
        if (!WRITE_EXTS.includes(ext)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Type not allowed: ${ext}` }));
          return;
        }
        const root = path.resolve(projectRoot || appRoot);
        const resolved = path.resolve(root, file);
        const allowed = [path.resolve(appRoot), path.resolve(edsRoot)];
        if (!allowed.some(r => resolved.startsWith(r + path.sep) || resolved === r)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Path not in allowed roots' }));
          return;
        }
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
        fs.writeFileSync(resolved, content, 'utf8');
        console.log(`[${new Date().toISOString().slice(11, 19)}] WRITE ${path.relative(root, resolved)}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, file: resolved }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Project config (re-reads each time for freshness) ──
  if (url === '/eds/config.json') {
    try {
      const fresh = fs.readFileSync(configPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(fresh);
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(config));
    }
    return;
  }

  // ── EDS data files (tickets, etc.) ──
  if (url.startsWith('/eds/tickets/')) {
    serve(path.join(edsRoot, url.slice(5)), res);
    return;
  }

  // ── EDS studio files ──
  if (url.startsWith('/eds/') || url === '/eds') {
    let rel = url.slice(5) || 'index.html';
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    serve(path.join(studioRoot, rel), res);
    return;
  }

  // ── App files ──
  const rel = url === '/' ? '/index.html' : url;
  serve(path.join(appRoot, rel), res);

}).listen(PORT, () => {
  console.log(`\n  EDS Server — ${config.name}`);
  console.log(`  App:    http://localhost:${PORT}/`);
  console.log(`  Studio: http://localhost:${PORT}/eds/`);
  console.log(`  Write:  POST http://localhost:${PORT}/write`);
  console.log(`  Root:   ${appRoot}\n`);
});
