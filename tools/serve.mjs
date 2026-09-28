// Local preview that looks like GitHub Pages: /hs2-genetics/ is this repo, and /hs2-test3/ and /hs2-final/ are the
// sibling checkouts in the estate folder, so her figures hot-link exactly as they will on jeremyspm.github.io.
//   node tools/serve.mjs [port]      (default 8765; set ESTATE=path/to/github if the sims live elsewhere)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ESTATE = process.env.ESTATE || 'C:/Users/USER/Desktop/github';
const ROOTS = { 'hs2-genetics': HERE, 'hs2-test3': join(ESTATE, 'hs2-test3'), 'hs2-final': join(ESTATE, 'hs2-final') };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const port = +process.argv[2] || 8765;
createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/') { res.writeHead(302, { location: '/hs2-genetics/' }); return res.end(); }
  const [, repo, ...rest] = url.split('/');
  const root = ROOTS[repo];
  if (!root) { res.writeHead(404); return res.end('not found'); }
  let file = resolve(root, rest.join('/'));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/hs2-genetics/`));
