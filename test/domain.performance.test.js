import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createInitialState, createLevel, reduce, toViewModel } from '../game-domain.js';

function sample(name, callback) {
  for (let index = 0; index < 100; index += 1) callback(index);
  const values = [];
  for (let index = 0; index < 1000; index += 1) {
    const start = performance.now();
    callback(index);
    values.push(performance.now() - start);
  }
  values.sort((left, right) => left - right);
  const percentile = (value) => values[Math.min(values.length - 1, Math.ceil(values.length * value) - 1)];
  const statistics = { p50: percentile(0.5), p95: percentile(0.95), max: values.at(-1) };
  console.log(`${name}: p50=${statistics.p50.toFixed(4)}ms p95=${statistics.p95.toFixed(4)}ms max=${statistics.max.toFixed(4)}ms node=${process.version}`);
  assert.ok(statistics.p95 < 5, `${name} p95 must be below 5ms, received ${statistics.p95.toFixed(4)}ms`);
}

test('performance: U1 operations meet the p95 gate', () => {
  const state = reduce(createInitialState(101), { type: 'START' }).state;
  sample('createLevel', (index) => createLevel((index % 12) + 1, index));
  sample('reduce', (index) => reduce(state, { type: 'TICK', elapsedMs: index }));
  sample('toViewModel', (index) => toViewModel({ ...state, elapsedMs: index }));
});
