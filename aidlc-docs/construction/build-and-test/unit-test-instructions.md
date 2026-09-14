# Unit Test Instructions

## Scope

U1 is the pure game-domain unit in `game-domain.js`. Tests intentionally run without DOM, React, Three.js, WebGL, storage, or browser APIs.

## Commands

```bash
npm test
# Optional focused suites
npm run test:example
npm run test:property
npm run test:performance
```

## Expected results

- `test/domain.example.test.js`: explicit gameplay rules — start, valid/invalid platform selection, landing failure, lives, score, level clear, restart, and deterministic read-only projection.
- `test/domain.property.test.js`: fast-check properties for deterministic/reachable levels, river bounds, legal score/life ranges across action sequences, high-score policy, and view-model referential transparency.
- `test/domain.performance.test.js`: p95 gate below 5 ms for `createLevel`, `reduce`, and `toViewModel`.

The validated baseline is **14 passing tests, 0 failures**. Fast-check shrinking and replay metadata remain enabled by default; retain test output when a property fails so its seed/counterexample can be replayed.

## Failure procedure

1. Read the named assertion and counterexample/seed from test output.
2. Fix `game-domain.js` without adding browser or rendering dependencies.
3. Add a concrete example regression if the failure revealed a previously unknown edge case.
4. Run `npm test` until all suites pass.
