import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
const packages = Object.entries(lock.packages ?? {})
  .filter(([path]) => path.startsWith('node_modules/'))
  .map(([path, metadata]) => ({ name: path.slice('node_modules/'.length), version: metadata.version, resolved: metadata.resolved, integrity: metadata.integrity }))
  .sort((left, right) => left.name.localeCompare(right.name));
const sbom = { format: 'npm-lockfile-summary', generatedAt: new Date().toISOString(), lockfileVersion: lock.lockfileVersion, packages };
const output = resolve(root, 'artifacts/sbom.json');
await mkdir(resolve(root, 'artifacts'), { recursive: true });
await writeFile(output, `${JSON.stringify(sbom, null, 2)}\n`);
console.log(`SBOM generated: ${output} (${packages.length} packages)`);
