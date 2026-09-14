const MAX_LIVES = 3;
const MAX_DIFFICULTY = 8;
const JUMP_DURATION_MS = 550;
const RIVER = Object.freeze({ minX: -1, maxX: 32, minZ: -7, maxZ: 7 });
const EFFECT_NAMES = new Set(['start', 'jump', 'splash', 'clear', 'reject']);
const PHASES = new Set(['ready', 'playing', 'jumping', 'level-complete', 'game-over']);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const hash = (value) => {
  let state = (value | 0) + 0x6d2b79f5;
  state = Math.imul(state ^ (state >>> 15), state | 1);
  state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
  return (state ^ (state >>> 14)) >>> 0;
};

export function deriveSeed(baseSeed, levelNumber) {
  return hash((finite(baseSeed) | 0) ^ Math.imul(Math.max(1, levelNumber | 0), 0x9e3779b1));
}

export function createPrng(seed) {
  let state = hash(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function difficultyFor(levelNumber) {
  const level = clamp(Math.floor(finite(levelNumber, 1)), 1, MAX_DIFFICULTY);
  return {
    level,
    platformCount: 4 + level,
    speed: 0.55 + level * 0.08,
    halfWidth: Math.max(0.72, 1.25 - level * 0.06),
    halfDepth: Math.max(0.65, 1.05 - level * 0.045),
    lateralOffset: 0.45 + level * 0.2,
  };
}

export function createLevel(levelNumber = 1, baseSeed = 1) {
  const safeLevel = Math.max(1, Math.floor(finite(levelNumber, 1)));
  const seed = deriveSeed(baseSeed, safeLevel);
  const random = createPrng(seed);
  const difficulty = difficultyFor(safeLevel);
  const start = { x: 0, y: 0.35, z: 0 };
  const goal = { x: (difficulty.platformCount + 1) * 3, y: 0.35, z: 0 };
  const platforms = [];
  const mainPathIds = [];
  for (let index = 0; index < difficulty.platformCount; index += 1) {
    const id = `main-${index + 1}`;
    mainPathIds.push(id);
    const x = (index + 1) * 3;
    const z = (random() * 2 - 1) * difficulty.lateralOffset;
    platforms.push({
      id,
      kind: 'main',
      fromIndex: index - 1,
      base: { x, y: 0.35, z },
      halfWidth: difficulty.halfWidth,
      halfDepth: difficulty.halfDepth,
      amplitudeX: 0.06 + random() * 0.12,
      amplitudeZ: 0.08 + random() * (0.12 + difficulty.level * 0.01),
      angularSpeed: difficulty.speed + random() * 0.18,
      phase: random() * Math.PI * 2,
    });
  }
  const branchIds = [];
  if (safeLevel >= 2 && random() > 0.45) {
    const fromIndex = Math.floor(random() * Math.max(1, difficulty.platformCount - 1));
    const parent = platforms[fromIndex];
    const id = `branch-${fromIndex + 1}`;
    branchIds.push(id);
    platforms.push({
      id,
      kind: 'branch',
      fromIndex,
      base: { x: parent.base.x + 2.35, y: 0.35, z: clamp(parent.base.z + (random() > 0.5 ? 2.8 : -2.8), RIVER.minZ + 1, RIVER.maxZ - 1) },
      halfWidth: Math.max(0.55, difficulty.halfWidth - 0.18),
      halfDepth: Math.max(0.5, difficulty.halfDepth - 0.18),
      amplitudeX: 0.08 + random() * 0.12,
      amplitudeZ: 0.18 + random() * 0.2,
      angularSpeed: difficulty.speed + 0.1,
      phase: random() * Math.PI * 2,
    });
  }
  const level = { levelNumber: safeLevel, seed, start, goal, platforms, mainPathIds, branchIds, difficulty };
  if (!validateReachability(level)) throw new Error('Generated an unreachable level');
  return level;
}

export function validateReachability(level) {
  if (!level || !Array.isArray(level.platforms) || !Array.isArray(level.mainPathIds) || level.mainPathIds.length === 0) return false;
  const ids = new Set(level.platforms.map((platform) => platform.id));
  return ids.size === level.platforms.length && level.mainPathIds.every((id) => ids.has(id));
}

export function getPlatformPose(platform, elapsedMs = 0) {
  const seconds = Math.max(0, finite(elapsedMs)) / 1000;
  const angle = platform.angularSpeed * seconds + platform.phase;
  const x = clamp(platform.base.x + platform.amplitudeX * Math.sin(angle), RIVER.minX + platform.halfWidth, RIVER.maxX - platform.halfWidth);
  const z = clamp(platform.base.z + platform.amplitudeZ * Math.cos(angle), RIVER.minZ + platform.halfDepth, RIVER.maxZ - platform.halfDepth);
  return { id: platform.id, x, y: platform.base.y, z, rotationY: Math.sin(angle) * 0.08, halfWidth: platform.halfWidth, halfDepth: platform.halfDepth };
}

export function canSupport(pose, worldPosition, safetyMargin = 0.1) {
  if (!pose || !worldPosition || !Number.isFinite(worldPosition.x) || !Number.isFinite(worldPosition.z)) return false;
  return Math.abs(worldPosition.x - pose.x) <= Math.max(0, pose.halfWidth - safetyMargin)
    && Math.abs(worldPosition.z - pose.z) <= Math.max(0, pose.halfDepth - safetyMargin);
}

export const scoreJump = () => 10;
export const scoreLevelClear = (lives) => 100 + clamp(Math.floor(finite(lives)), 0, MAX_LIVES) * 25;
export const updateHighScore = (highScore, score) => Math.max(0, finite(highScore), finite(score));

function safeEffect(type, payload = {}) {
  return { type, ...payload };
}
function reject(state) {
  return { state, effects: [safeEffect('PLAY_SOUND', { name: 'reject' }), safeEffect('SHOW_FEEDBACK', { key: 'invalid-move' })] };
}
function platformById(level, id) {
  return level.platforms.find((platform) => platform.id === id);
}
function nextTargets(state) {
  if (state.sheep.platformId === null) {
    const first = state.level.mainPathIds[0];
    return state.level.platforms.filter((platform) => platform.id === first);
  }
  const index = state.level.mainPathIds.indexOf(state.sheep.platformId);
  if (index < 0) return [];
  const nextMain = state.level.mainPathIds[index + 1];
  return state.level.platforms.filter((platform) => platform.id === nextMain || (platform.kind === 'branch' && platform.fromIndex === index));
}
function resetSheep(level) {
  return { x: level.start.x, y: level.start.y, z: level.start.z, platformId: null, status: 'standing' };
}
function drop(state) {
  const lives = Math.max(0, state.lives - 1);
  const base = { ...state, lives, jump: null, sheep: { ...resetSheep(state.level), status: lives === 0 ? 'falling' : 'standing' } };
  if (lives === 0) {
    return { state: { ...base, phase: 'game-over', feedback: 'game-over' }, effects: [safeEffect('SPLASH', { position: state.sheep }), safeEffect('PLAY_SOUND', { name: 'splash' }), safeEffect('ANNOUNCE', { key: 'game-over' })] };
  }
  return { state: { ...base, phase: 'playing', feedback: 'splash' }, effects: [safeEffect('SPLASH', { position: state.sheep }), safeEffect('PLAY_SOUND', { name: 'splash' }), safeEffect('SHOW_FEEDBACK', { key: 'splash' })] };
}
function startState(previous) {
  const level = createLevel(1, previous.baseSeed);
  return { ...previous, phase: 'playing', levelNumber: 1, levelSeed: level.seed, lives: MAX_LIVES, score: 0, elapsedMs: 0, level, sheep: resetSheep(level), jump: null, feedback: 'started' };
}

export function createInitialState(baseSeed = 12345, highScore = 0) {
  const safeSeed = finite(baseSeed, 12345) | 0;
  const level = createLevel(1, safeSeed);
  return { phase: 'ready', levelNumber: 1, baseSeed: safeSeed, levelSeed: level.seed, lives: MAX_LIVES, score: 0, highScore: Math.max(0, finite(highScore)), muted: false, elapsedMs: 0, level, sheep: resetSheep(level), jump: null, feedback: 'ready' };
}

function completeLanding(state, jump, elapsedMs) {
  const target = platformById(state.level, jump.targetId);
  const pose = getPlatformPose(target, elapsedMs);
  if (!canSupport(pose, jump.landingPosition)) return drop({ ...state, elapsedMs });
  const score = state.score + scoreJump();
  const isGoalPlatform = target.id === state.level.mainPathIds.at(-1);
  if (!isGoalPlatform) {
    return { state: { ...state, phase: 'playing', elapsedMs, score, highScore: updateHighScore(state.highScore, score), jump: null, sheep: { ...pose, platformId: target.id, status: 'standing' }, feedback: 'landed' }, effects: [safeEffect('PLAY_SOUND', { name: 'jump' }), safeEffect('SHOW_FEEDBACK', { key: 'landed' })] };
  }
  const clearedScore = score + scoreLevelClear(state.lives);
  const nextLevelNumber = state.levelNumber + 1;
  const nextLevel = createLevel(nextLevelNumber, state.baseSeed);
  return { state: { ...state, phase: 'playing', levelNumber: nextLevelNumber, levelSeed: nextLevel.seed, level: nextLevel, elapsedMs: 0, score: clearedScore, highScore: updateHighScore(state.highScore, clearedScore), jump: null, sheep: resetSheep(nextLevel), feedback: 'level-clear' }, effects: [safeEffect('PLAY_SOUND', { name: 'clear' }), safeEffect('ANNOUNCE', { key: 'level-clear' })] };
}

export function reduce(state, action) {
  if (!state || !PHASES.has(state.phase) || !action || typeof action.type !== 'string') return reject(state);
  if (action.type === 'TOGGLE_MUTE') return { state: { ...state, muted: !state.muted }, effects: [] };
  if (action.type === 'RESTART') return { state: startState(state), effects: [safeEffect('PLAY_SOUND', { name: 'start' }), safeEffect('ANNOUNCE', { key: 'restarted' })] };
  if (action.type === 'START') {
    if (state.phase !== 'ready') return reject(state);
    return { state: startState(state), effects: [safeEffect('PLAY_SOUND', { name: 'start' }), safeEffect('ANNOUNCE', { key: 'started' })] };
  }
  if (action.type === 'SELECT_PLATFORM') {
    if (state.phase !== 'playing' || typeof action.platformId !== 'string') return reject(state);
    const target = nextTargets(state).find((platform) => platform.id === action.platformId);
    if (!target) return reject(state);
    const landingPosition = getPlatformPose(target, state.elapsedMs);
    return { state: { ...state, phase: 'jumping', jump: { targetId: target.id, startedAtMs: state.elapsedMs, endsAtMs: state.elapsedMs + JUMP_DURATION_MS, landingPosition }, feedback: 'jumping' }, effects: [safeEffect('PLAY_SOUND', { name: 'jump' })] };
  }
  if (action.type === 'TICK') {
    const elapsedMs = Math.max(state.elapsedMs, finite(action.elapsedMs, state.elapsedMs));
    if (state.phase !== 'jumping') return { state: elapsedMs === state.elapsedMs ? state : { ...state, elapsedMs }, effects: [] };
    if (elapsedMs < state.jump.endsAtMs) return { state: { ...state, elapsedMs }, effects: [] };
    return completeLanding(state, state.jump, elapsedMs);
  }
  if (action.type === 'ACKNOWLEDGE_EFFECT') return { state: { ...state, feedback: null }, effects: [] };
  return reject(state);
}

export function toViewModel(state) {
  const selectable = new Set(state.phase === 'playing' ? nextTargets(state).map((platform) => platform.id) : []);
  const platforms = state.level.platforms.map((platform) => ({ ...getPlatformPose(platform, state.elapsedMs), id: platform.id, kind: platform.kind, selectable: selectable.has(platform.id) }));
  return { phase: state.phase, levelNumber: state.levelNumber, lives: state.lives, score: state.score, highScore: state.highScore, muted: state.muted, sheep: { ...state.sheep }, platforms, start: { ...state.level.start }, goal: { ...state.level.goal }, feedback: state.feedback };
}

export const DOMAIN_CONSTANTS = Object.freeze({ MAX_LIVES, MAX_DIFFICULTY, JUMP_DURATION_MS, RIVER: { ...RIVER }, EFFECT_NAMES: [...EFFECT_NAMES] });
