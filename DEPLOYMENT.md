# Static Hosting Security Notes

Serve all files from the repository root over HTTPS. Apply every directive in `static-headers.conf` to HTML responses; apply at least `X-Content-Type-Options: nosniff` to JavaScript, JSON, CSS and vendor files.

The production runtime loads only same-origin local modules from `vendor/`; no CDN, external images, models, analytics, remote API, account data, or secrets are used. Regenerate `vendor/`, `vendor/manifest.json`, and `artifacts/sbom.json` after any npm dependency update, then run audit and browser tests.

HSTS should be enabled only on an HTTPS production host. The local development server deliberately omits HSTS because it serves HTTP.
