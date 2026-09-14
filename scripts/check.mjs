import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = ['game-domain.js', 'game.js', 'index.html', 'static-headers.conf', 'vendor/runtime.js', 'vendor/manifest.json', 'test/domain.example.test.js', 'test/domain.property.test.js', 'test/domain.performance.test.js', 'test/browser.smoke.test.mjs'];
for (const file of required) await access(resolve(root, file));
const domainSource = await readFile(resolve(root, 'game-domain.js'), 'utf8');
const forbiddenDomain = /(?:from\s+['"](?:react|three|@react-three\/fiber)|\b(?:window|document|localStorage|fetch|AudioContext)\b)/;
if (forbiddenDomain.test(domainSource)) throw new Error('U1 domain module must not depend on browser or rendering APIs');
const index = await readFile(resolve(root, 'index.html'), 'utf8');
const runtime = await readFile(resolve(root, 'game.js'), 'utf8');
if (/https?:\/\//.test(index) || /https?:\/\//.test(runtime)) throw new Error('Runtime must not contain remote URLs');
const headers = await readFile(resolve(root, 'static-headers.conf'), 'utf8');
for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy']) {
  if (!headers.includes(header)) throw new Error(`Missing required static header: ${header}`);
}
if (!headers.includes("script-src 'self'")) throw new Error('CSP must limit scripts to same-origin resources');
if (/unsafe-(?:eval|inline)/.test(headers)) throw new Error('CSP must not permit unsafe eval or inline execution');
const bundle = await readFile(resolve(root, 'vendor/runtime.js'));
const manifest = JSON.parse(await readFile(resolve(root, 'vendor/manifest.json'), 'utf8'));
const runtimeFile = manifest.files?.find((file) => file.path === 'runtime.js');
const digest = createHash('sha256').update(bundle).digest('hex');
if (manifest.builder?.name !== 'esbuild' || manifest.builder?.version !== '0.27.4') throw new Error('Vendor manifest must record the pinned local bundler');
if (!runtimeFile || runtimeFile.bytes !== bundle.length || runtimeFile.sha256 !== digest) throw new Error('Vendor runtime bundle does not match its manifest integrity record');
console.log('Static U1/U2 checks passed.');
