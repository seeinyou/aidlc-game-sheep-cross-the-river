# Integration and Browser Test Instructions

## Purpose

Validate the U1-to-U2 seam: `GameSessionService` in the React/R3F runtime dispatches U1 reducer actions, and the static server delivers the same-origin bundled experience with safe WebGL failure handling.

## Automated scenarios

```bash
npm run test:browser
```

The Playwright suite starts `scripts/serve.mjs` on port 4173 and cleans it up after tests.

1. **Normal WebGL workflow** — load the static app; find the start control and R3F canvas; start the game; toggle mute; verify the stable live-status control; reload and start again.
2. **WebGL unavailable** — override canvas context creation in a controlled browser context; verify the safe WebGL error overlay and visible reload button.

Expected baseline: **2 passing tests, 0 failures**. Tests must not rely on console failures.

## Manual scene sanity check

```bash
npm run serve
```

At `http://127.0.0.1:4173/`:

1. Start a game and confirm the river, banks, sheep, and highlighted selectable board render.
2. Click a highlighted board; confirm the score/HUD and sheep state update.
3. Toggle mute and reload; confirm the control remains usable.
4. Disable WebGL in a test browser/device profile; confirm the safe overlay appears instead of a broken screen.

Stop the server with `Ctrl+C`. No databases, API endpoints, account credentials, or external services are involved, so API contract testing is N/A.
