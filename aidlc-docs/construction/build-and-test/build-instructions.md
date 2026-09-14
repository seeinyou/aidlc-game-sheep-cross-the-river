# Build Instructions

## Prerequisites

- Node.js `>=24.3.0` and npm `11.6.0` (validated environment: Node `v24.3.0`).
- A macOS, Linux, or Windows shell with network access only for the initial `npm ci` download from the configured official npm registry.
- No environment variables, credentials, cloud accounts, databases, or services are required.
- For browser tests, install Playwright Chromium once with `npx playwright install chromium`.

## Reproducible build

```bash
npm ci --ignore-scripts
npm run vendor:runtime
npm run check
```

`npm ci` restores the exact `package-lock.json` dependency graph. `npm run vendor:runtime` invokes pinned `esbuild@0.27.4` to create the browser ESM bundle from local dependencies only.

## Expected artifacts

- `vendor/runtime.js` — same-origin browser runtime bundle.
- `vendor/manifest.json` — lockfile metadata, builder version, byte count, and SHA-256 of `runtime.js`.
- `artifacts/sbom.json` — generated separately with `npm run sbom`.

`npm run check` must report `Static U1/U2 checks passed.` It verifies the U1 browser-free boundary, required headers, strict CSP (no `unsafe-inline` / `unsafe-eval`), bundle SHA-256, and pinned bundler metadata.

## Local execution

```bash
npm run serve
```

Open `http://127.0.0.1:4173/`. This server is for local validation only and deliberately does not emit HSTS because it uses HTTP. Production HTTPS hosting must apply every header in `static-headers.conf`; see `DEPLOYMENT.md`.

## Troubleshooting

- **Bundle resolution failure:** delete `node_modules` and `vendor`, then rerun `npm ci --ignore-scripts && npm run vendor:runtime`.
- **Bundle integrity failure:** do not edit `vendor/runtime.js`; rerun `npm run vendor:runtime` to regenerate its manifest hash.
- **Chromium unavailable:** run `npx playwright install chromium`, then rerun `npm run test:browser`.
- **WebGL overlay appears:** use a current WebGL-capable browser or inspect its GPU/WebGL settings. The overlay is an intentional safe failure mode, not a 2D fallback.
