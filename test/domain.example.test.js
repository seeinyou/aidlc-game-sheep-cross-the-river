import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, createLevel, getPlatformPose, reduce, scoreLevelClear, toViewModel } from '../game-domain.js';

const startGame = (seed = 17) => reduce(createInitialState(seed), { type: 'START' }).state;
const firstPlatform = (state) => state.level.mainPathIds[0];
const land = (state, platformId = firstPlatform(state)) => {
  const jumping = reduce(state, { type: 'SELECT_PLATFORM', platformId }).state;
  return reduce(jumping, { type: 'TICK', elapsedMs: jumping.jump.endsAtMs });
};

test('START creates level one with full lives and zero score', () => {
  const transition = reduce(createInitialState(8), { type: 'START' });
  assert.equal(transition.state.phase, 'playing');
  assert.equal(transition.state.levelNumber, 1);
  assert.equal(transition.state.lives, 3);
  assert.equal(transition.state.score, 0);
  assert.equal(transition.effects[0].name, 'start');
});

test('invalid platform selection safely rejects without changing score or lives', () => {
  const state = startGame();
  const transition = reduce(state, { type: 'SELECT_PLATFORM', platformId: 'missing' });
  assert.equal(transition.state, state);
  assert.equal(transition.state.score, 0);
  assert.equal(transition.state.lives, 3);
  assert.equal(transition.effects.at(-1).key, 'invalid-move');
});

test('a valid first jump lands and earns ten points', () => {
  const state = startGame(1);
  const transition = land(state);
  assert.equal(transition.state.phase, 'playing');
  assert.equal(transition.state.score, 10);
  assert.equal(transition.state.sheep.platformId, firstPlatform(state));
});

test('a landing position outside its platform loses one life and resets the sheep', () => {
  const state = startGame(2);
  const jumping = reduce(state, { type: 'SELECT_PLATFORM', platformId: firstPlatform(state) }).state;
  const forcedMiss = { ...jumping, jump: { ...jumping.jump, landingPosition: { x: 999, y: 0, z: 999 } } };
  const transition = reduce(forcedMiss, { type: 'TICK', elapsedMs: forcedMiss.jump.endsAtMs });
  assert.equal(transition.state.lives, 2);
  assert.equal(transition.state.phase, 'playing');
  assert.equal(transition.state.sheep.platformId, null);
  assert.equal(transition.effects.some((effect) => effect.name === 'splash'), true);
});

test('the final life loss enters game-over and rejects future platform input', () => {
  const state = { ...startGame(3), lives: 1 };
  const jumping = reduce(state, { type: 'SELECT_PLATFORM', platformId: firstPlatform(state) }).state;
  const forcedMiss = { ...jumping, jump: { ...jumping.jump, landingPosition: { x: 999, y: 0, z: 999 } } };
  const ended = reduce(forcedMiss, { type: 'TICK', elapsedMs: forcedMiss.jump.endsAtMs }).state;
  assert.equal(ended.phase, 'game-over');
  assert.equal(ended.lives, 0);
  assert.equal(reduce(ended, { type: 'SELECT_PLATFORM', platformId: firstPlatform(ended) }).state, ended);
});

test('landing every main-path platform advances level and awards clear bonus', () => {
  let state = startGame(11);
  const originalLevel = state.levelNumber;
  const originalPath = [...state.level.mainPathIds];
  for (const platformId of originalPath) state = land(state, platformId).state;
  assert.equal(state.levelNumber, originalLevel + 1);
  assert.equal(state.score, originalPath.length * 10 + scoreLevelClear(3));
});

test('restart resets a run while preserving high score and mute setting', () => {
  const running = { ...startGame(5), score: 90, highScore: 90, muted: true, lives: 1 };
  const restarted = reduce(running, { type: 'RESTART' }).state;
  assert.equal(restarted.levelNumber, 1);
  assert.equal(restarted.score, 0);
  assert.equal(restarted.lives, 3);
  assert.equal(restarted.highScore, 90);
  assert.equal(restarted.muted, true);
});

test('level generation and view model are deterministic and read-only', () => {
  const level = createLevel(4, 99);
  assert.deepEqual(level, createLevel(4, 99));
  const state = startGame(99);
  const before = structuredClone(state);
  const first = toViewModel(state);
  const second = toViewModel(state);
  assert.deepEqual(first, second);
  assert.deepEqual(state, before);
  assert.ok(getPlatformPose(level.platforms[0], 0));
});
