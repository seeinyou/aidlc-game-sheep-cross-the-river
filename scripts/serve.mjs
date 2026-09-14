import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const headers = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'sha256-dFmytIpEsKMlTVFczltfchCGf7an8K5vGQxf7zgTEbU='; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin'
};
createServer((request, response) => {
  const pathname = decodeURIComponent((request.url || '/').split('?')[0]);
  const relative = pathname === '/' ? 'index.html' : normalize(pathname).replace(/^[/\\]+/, '');
  const file = resolve(root, relative);
  if (!file.startsWith(root + sep) && file !== resolve(root, 'index.html')) { response.writeHead(403, headers).end('Forbidden'); return; }
  if (!existsSync(file)) { response.writeHead(404, headers).end('Not found'); return; }
  stat(file).then((metadata) => {
    if (!metadata.isFile()) { response.writeHead(404, headers).end('Not found'); return; }
    response.writeHead(200, { ...headers, 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  }).catch(() => response.writeHead(404, headers).end('Not found'));
}).listen(port, () => console.log(`Static game server: http://127.0.0.1:${port}`));
