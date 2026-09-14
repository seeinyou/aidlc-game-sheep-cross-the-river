import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;
let server;
let browser;

test.before(async () => {
  server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  browser = await chromium.launch({ headless: true });
});
test.after(async () => { await browser?.close(); server?.kill(); });

async function pageWithWebGL(webgl = true) {
  const page = await browser.newPage();
  if (!webgl) await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  return page;
}

test('browser smoke: starts, exposes stable controls, toggles mute, and restarts', async () => {
  const page = await pageWithWebGL();
  await assert.doesNotReject(() => page.waitForSelector('[data-testid="game-start-button"]'));
  await page.getByTestId('game-start-button').click();
  await page.waitForSelector('[data-testid="game-canvas"]');
  await page.getByTestId('game-mute-button').click();
  await page.evaluate(() => document.querySelector('[data-testid="game-status-live-region"]')?.textContent);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('game-start-button').click();
  await page.keyboard.press('Escape');
  await page.close();
});

test('browser smoke: WebGL failure shows a safe reload overlay', async () => {
  const page = await pageWithWebGL(false);
  await page.getByTestId('game-error-overlay').waitFor();
  await assert.doesNotReject(() => page.getByTestId('game-reload-button').isVisible());
  assert.match(await page.getByTestId('game-error-overlay').textContent(), /WebGL/);
  await page.close();
});
