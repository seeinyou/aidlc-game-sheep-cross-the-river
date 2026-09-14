import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const vendor = resolve(root, 'vendor');
await rm(vendor, { recursive: true, force: true });
await mkdir(vendor, { recursive: true });

await build({
  entryPoints: [resolve(root, 'game.js')],
  outfile: resolve(vendor, 'runtime.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info'
});

const files = [];
async function digest(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await digest(path);
    else {
      const content = await readFile(path);
      files.push({
        path: path.slice(vendor.length + 1),
        bytes: content.length,
        sha256: createHash('sha256').update(content).digest('hex')
      });
    }
  }
}
await digest(vendor);
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
const rootPackage = lock.packages[''];
const manifest = {
  generatedAt: new Date().toISOString(),
  lockfileVersion: lock.lockfileVersion,
  builder: { name: 'esbuild', version: rootPackage.devDependencies.esbuild },
  runtime: 'runtime.js',
  packages: {
    react: rootPackage.dependencies.react,
    'react-dom': rootPackage.dependencies['react-dom'],
    three: rootPackage.dependencies.three,
    '@react-three/fiber': rootPackage.dependencies['@react-three/fiber']
  },
  files: files.sort((left, right) => left.path.localeCompare(right.path))
};
await writeFile(resolve(vendor, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Local runtime bundle generated with ${files.length} file(s).`);
