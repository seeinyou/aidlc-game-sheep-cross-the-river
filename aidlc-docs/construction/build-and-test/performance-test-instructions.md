# Performance Test Instructions

## Performance objectives

- U1 `createLevel`, `reduce`, and `toViewModel` p95 execution time: below 5 ms.
- U2 observes frames during play and degrades visual quality once after two seconds continuously below 30 FPS; the degraded quality remains for the session.

## Execute the deterministic domain benchmark

```bash
npm run test:performance
```

The test prints p50, p95, and max duration for U1 domain operations. Treat p95 at or above 5 ms as a failure.

## Browser performance smoke

```bash
npm run test:browser
```

This validates that the bundled runtime reaches an interactive WebGL canvas and that the WebGL error path remains safe. It is a functional smoke test, not a stable cross-machine FPS benchmark; GPU/driver variance makes a fixed headless frame-rate threshold unsuitable.

## Manual adaptive-quality verification

1. Run `npm run serve` in a browser with DevTools performance throttling enabled.
2. Start the game and sustain rendering below 30 FPS for more than two seconds.
3. Confirm the scene remains interactive and pixel ratio/particle quality are reduced once.
4. Reload or restart as needed to reset the per-session quality controller.

No server load, throughput, concurrency, or database performance test applies because the product is a static client-only game.
