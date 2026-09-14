import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { DOMAIN_CONSTANTS, canSupport, createInitialState, createLevel, getPlatformPose, reduce, scoreLevelClear, toViewModel, updateHighScore, validateReachability } from '../game-domain.js';

const levelArb = fc.integer({ min: 1, max: 30 });
const seedArb = fc.integer({ min: -2147483648, max: 2147483647 });
const timeArb = fc.integer({ min: 0, max: 120000 });
const commandArb = fc.array(fc.constantFrom('toggle', 'tick', 'invalid'), { minLength: 0, maxLength: 30 });
const options = { numRuns: 120, verbose: 1 };

test('property: generated levels are reachable and deterministic', () => {
  fc.assert(fc.property(levelArb, seedArb, (levelNumber, seed) => {
    const level = createLevel(levelNumber, seed);
    assert.equal(validateReachability(level), true);
    assert.deepEqual(level, createLevel(levelNumber, seed));
    assert.equal(level.levelNumber, levelNumber);
  }), options);
});

test('property: platform poses remain within river bounds', () => {
  fc.assert(fc.property(levelArb, seedArb, timeArb, (levelNumber, seed, elapsedMs) => {
    const level = createLevel(levelNumber, seed);
    for (const platform of level.platforms) {
      const pose = getPlatformPose(platform, elapsedMs);
      assert.ok(pose.x - pose.halfWidth >= DOMAIN_CONSTANTS.RIVER.minX - 1e-9);
      assert.ok(pose.x + pose.halfWidth <= DOMAIN_CONSTANTS.RIVER.maxX + 1e-9);
      assert.ok(pose.z - pose.halfDepth >= DOMAIN_CONSTANTS.RIVER.minZ - 1e-9);
      assert.ok(pose.z + pose.halfDepth <= DOMAIN_CONSTANTS.RIVER.maxZ + 1e-9);
      assert.equal(canSupport(pose, { x: pose.x, z: pose.z }), true);
    }
  }), options);
});

test('property: score and lives always remain in range across safe action sequences', () => {
  fc.assert(fc.property(seedArb, commandArb, (seed, commands) => {
    let state = reduce(createInitialState(seed), { type: 'START' }).state;
    for (const command of commands) {
      if (command === 'toggle') state = reduce(state, { type: 'TOGGLE_MUTE' }).state;
      if (command === 'tick') state = reduce(state, { type: 'TICK', elapsedMs: state.elapsedMs + 37 }).state;
      if (command === 'invalid') state = reduce(state, { type: 'SELECT_PLATFORM', platformId: 'not-a-platform' }).state;
      assert.ok(state.lives >= 0 && state.lives <= DOMAIN_CONSTANTS.MAX_LIVES);
      assert.ok(state.score >= 0 && state.highScore >= 0);
      assert.ok(['ready', 'playing', 'jumping', 'level-complete', 'game-over'].includes(state.phase));
      assert.equal(state.jump !== null, state.phase === 'jumping');
    }
  }), options);
});

test('property: score policy is non-negative and high score is the maximum', () => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 100000 }), fc.integer({ min: 0, max: 100000 }), fc.integer({ min: -3, max: 6 }), (high, score, lives) => {
    assert.equal(updateHighScore(high, score), Math.max(high, score));
    assert.ok(scoreLevelClear(lives) >= 100);
  }), options);
});

test('property: view model projection is referentially transparent', () => {
  fc.assert(fc.property(seedArb, timeArb, (seed, elapsedMs) => {
    const state = reduce(createInitialState(seed), { type: 'START' }).state;
    const timed = reduce(state, { type: 'TICK', elapsedMs }).state;
    const before = structuredClone(timed);
    assert.deepEqual(toViewModel(timed), toViewModel(timed));
    assert.deepEqual(timed, before);
  }), options);
});
