# Security and Supply-Chain Test Instructions

## Commands

```bash
npm run check
npm audit --audit-level=high
npm run sbom
```

## Expected results

- `npm run check` verifies required static headers, restrictive same-origin CSP, absence of `unsafe-inline` and `unsafe-eval`, U1 browser-API isolation, local runtime files, fixed `esbuild@0.27.4`, and `vendor/runtime.js` SHA-256 against `vendor/manifest.json`.
- `npm audit --audit-level=high` must exit with status 0. The validated set has no high or critical findings.
- `npm run sbom` regenerates `artifacts/sbom.json` from the exact npm lockfile.

## Static hosting checks

For HTTPS production hosting, apply every directive in `static-headers.conf` to HTML responses:

- restrictive same-origin CSP;
- HSTS `max-age=31536000; includeSubDomains`;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`.

The local HTTP validation server intentionally does not send HSTS. It rejects traversal attempts and directories.

## Known advisory

npm currently reports one low-severity advisory for `esbuild@0.27.4` concerning its Windows development server. This project does not run or expose that server: esbuild is invoked only as a local, build-time bundle generator. It does not block the approved high-severity gate. Reassess the exact pinned version before any dependency upgrade.

Authentication, authorization, API parameter validation, encryption-at-rest, network controls, centralized logging, and monitoring tests are N/A: the game has no server API, user accounts, datastore, cloud resources, or network intermediaries.
