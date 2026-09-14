# Build and Test Summary

## Build status

- **Status:** Success.
- **Build tool:** Node.js `v24.3.0`, npm lockfile version `3`, pinned `esbuild@0.27.4`.
- **Reproducibility:** `npm ci --ignore-scripts` restored 49 packages, then `npm run vendor:runtime` generated the local browser bundle.
- **Build artifact:** `vendor/runtime.js`, 3,276,911 bytes.
- **Integrity:** SHA-256 `cc13d87735ab5d490724469b9aa8adbade8b146c72a06a6afd522962831c4959`, recorded in `vendor/manifest.json` and validated by `npm run check`.
- **SBOM:** `artifacts/sbom.json`, 49 packages.

## Test execution summary

| Category | Evidence | Result |
|---|---|---|
| Static integrity and security | `npm run check` | Pass |
| U1 example, property, and performance | `npm test` | 14 passed / 0 failed |
| U1 performance p95 | `createLevel` 0.0039 ms; `reduce` 0.0002 ms; `toViewModel` 0.0018 ms; target < 5 ms | Pass |
| U1-to-U2 browser integration | `npm run test:browser` | 2 passed / 0 failed |
| Browser scenarios | Normal WebGL start/canvas/mute/reload; forced WebGL failure overlay | Pass |
| Supply-chain SBOM | `npm run sbom` | Pass |
| Vulnerability high-severity gate | `npm audit --audit-level=high` | Pass: 0 high / 0 critical |
| Source whitespace | `git diff --check` | Pass |

## Security disposition

- `static-headers.conf` defines restrictive same-origin CSP, HSTS for HTTPS deployment, `nosniff`, `X-Frame-Options: DENY`, and strict Referrer Policy.
- Static checks reject CSP `unsafe-inline` and `unsafe-eval`, verify U1 has no browser dependencies, and verify bundle manifest integrity.
- No API, authentication, datastore, cloud resource, external runtime resource, or network intermediary exists; associated security and contract-test controls are N/A.
- Audit reports one low-severity `esbuild@0.27.4` Windows development-server advisory. esbuild is used only as a local bundle generator, never as a served development server or browser runtime. This is recorded risk, not a failure of the high-severity gate.

## Instruction files

- `build-instructions.md`
- `unit-test-instructions.md`
- `integration-test-instructions.md`
- `performance-test-instructions.md`
- `security-test-instructions.md`

## Overall status

- **Build:** Success
- **All automated tests:** Pass
- **Ready for Operations:** Yes — Operations is currently an AI-DLC placeholder; no deployment was performed.
