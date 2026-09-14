import * as React from 'react';
import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { createInitialState, reduce, toViewModel } from './game-domain.js';

const h = React.createElement;
const HIGH_SCORE_KEY = 'sheep-river-high-score';

class HighScoreStore {
  constructor() { this.memory = 0; }
  read() { try { const value = Number(localStorage.getItem(HIGH_SCORE_KEY)); this.memory = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0; } catch {} return this.memory; }
  write(value) { this.memory = Math.max(this.memory, Math.floor(Number(value) || 0)); try { localStorage.setItem(HIGH_SCORE_KEY, String(this.memory)); } catch {} return this.memory; }
}

class AudioService {
  constructor() { this.context = null; this.silent = false; }
  async unlock() { if (this.silent || this.context) return; try { this.context = new AudioContext(); if (this.context.state === 'suspended') await this.context.resume(); } catch { this.silent = true; } }
  play(name, muted) {
    if (muted || this.silent || !this.context) return;
    const tones = { start: [440, .08], jump: [620, .06], splash: [140, .12], clear: [880, .16], reject: [180, .05] };
    const [frequency, duration] = tones[name] || tones.reject;
    try { const oscillator = this.context.createOscillator(); const gain = this.context.createGain(); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.06, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + duration); oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(this.context.currentTime + duration); oscillator.onended = () => oscillator.disconnect(); } catch { this.silent = true; }
  }
  dispose() { try { this.context?.close(); } catch {} this.context = null; }
}

class RenderQualityController {
  constructor(onChange) { this.onChange = onChange; this.samples = []; this.degraded = false; }
  observe(delta) { if (this.degraded) return; const now = performance.now(); this.samples.push([now, delta]); this.samples = this.samples.filter(([time]) => now - time <= 2000); if (this.samples.length > 20 && this.samples.every(([, frame]) => frame > 1 / 30)) { this.degraded = true; this.onChange({ pixelRatio: 1, particles: false }); } }
}

class GameSessionService {
  constructor(onSnapshot) { this.store = new HighScoreStore(); this.audio = new AudioService(); this.state = createInitialState(20260314, this.store.read()); this.onSnapshot = onSnapshot; this.raf = null; this.startedAt = null; this.visible = !document.hidden; this.active = false; this.timer = null; this.handleVisibility = this.handleVisibility.bind(this); document.addEventListener('visibilitychange', this.handleVisibility); this.emit(); }
  emit() { const viewModel = { ...toViewModel(this.state), jump: this.state.jump }; this.onSnapshot({ viewModel, state: this.state, audioSilent: this.audio.silent }); }
  async dispatch(action) { if (action.type === 'START' || action.type === 'SELECT_PLATFORM') await this.audio.unlock(); const transition = reduce(this.state, action); this.state = transition.state; this.store.write(this.state.highScore); for (const effect of transition.effects) { if (effect.type === 'PLAY_SOUND') this.audio.play(effect.name, this.state.muted); }
    this.active = ['playing', 'jumping'].includes(this.state.phase); if (this.state.feedback === 'level-clear') { clearTimeout(this.timer); this.timer = setTimeout(() => this.emit(), 1000); }
    this.emit(); this.schedule(); }
  schedule() { if (!this.active || !this.visible || this.raf !== null) return; this.raf = requestAnimationFrame((now) => { this.raf = null; if (this.startedAt === null) this.startedAt = now - this.state.elapsedMs; this.dispatch({ type: 'TICK', elapsedMs: Math.max(this.state.elapsedMs, Math.floor(now - this.startedAt)) }); }); }
  handleVisibility() { this.visible = !document.hidden; if (!this.visible && this.raf !== null) { cancelAnimationFrame(this.raf); this.raf = null; } if (this.visible) { this.startedAt = performance.now() - this.state.elapsedMs; this.schedule(); } }
  dispose() { if (this.raf !== null) cancelAnimationFrame(this.raf); clearTimeout(this.timer); document.removeEventListener('visibilitychange', this.handleVisibility); this.audio.dispose(); }
}

function ErrorOverlay({ onReload }) { return h('div', { className: 'overlay', 'data-testid': 'game-error-overlay' }, h('section', { className: 'card', role: 'alert' }, h('h2', null, '3D 场景暂时无法显示'), h('p', null, '请使用支持 WebGL 的现代浏览器，然后重新加载页面。'), h('button', { className: 'primary', onClick: onReload, 'data-testid': 'game-reload-button' }, '重新加载'))); }
class ErrorBoundary extends Component { constructor(props) { super(props); this.state = { failed: false }; } static getDerivedStateFromError() { return { failed: true }; } render() { return this.state.failed ? h(ErrorOverlay, { onReload: () => location.reload() }) : this.props.children; } }

function RiverScene() { return h(React.Fragment, null,
  h('color', { attach: 'background', args: ['#071726'] }), h('fog', { attach: 'fog', args: ['#071726', 18, 55] }),
  h('ambientLight', { intensity: 1.2 }), h('directionalLight', { position: [8, 16, 10], intensity: 2.1, castShadow: true }),
  h('mesh', { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true }, h('planeGeometry', { args: [46, 20] }), h('meshStandardMaterial', { color: '#0e7096', roughness: .32, metalness: .15 })),
  h('mesh', { position: [-3, .05, 0], receiveShadow: true }, h('boxGeometry', { args: [4, .7, 16] }), h('meshStandardMaterial', { color: '#32643a' })),
  h('mesh', { position: [35, .05, 0], receiveShadow: true }, h('boxGeometry', { args: [4, .7, 16] }), h('meshStandardMaterial', { color: '#32643a' }))
); }

function PlatformMesh({ platform, onSelect }) { const [hovered, setHovered] = useState(false); const selectable = platform.selectable; return h('group', { name: `platform-${platform.id}`, position: [platform.x, platform.y + (hovered && selectable ? .16 : 0), platform.z], rotation: [0, platform.rotationY, 0], onPointerEnter: () => selectable && setHovered(true), onPointerLeave: () => setHovered(false), onClick: (event) => { event.stopPropagation(); if (selectable) onSelect(platform.id); } },
  h('mesh', { castShadow: true, receiveShadow: true }, h('boxGeometry', { args: [platform.halfWidth * 2, .38, platform.halfDepth * 2] }), h('meshStandardMaterial', { color: selectable ? '#edb83d' : '#7b4b29', emissive: selectable ? '#6b3b00' : '#000000', emissiveIntensity: selectable ? .9 : 0, roughness: .72 })),
  selectable ? h('mesh', { position: [0, .22, 0] }, h('boxGeometry', { args: [platform.halfWidth * 2.1, .04, platform.halfDepth * 2.1] }), h('meshBasicMaterial', { color: '#ffe26d' })) : null
); }

function PlatformField({ platforms, onSelect }) { return h(React.Fragment, null, ...platforms.map((platform) => h(PlatformMesh, { key: platform.id, platform, onSelect }))); }
function SheepAvatar({ viewModel }) { const group = useRef(); useFrame(() => { if (!group.current) return; const sheep = viewModel.sheep; group.current.position.set(sheep.x, sheep.y + .35, sheep.z); }); return h('group', { ref: group }, h('mesh', { castShadow: true }, h('sphereGeometry', { args: [.48, 20, 16] }), h('meshStandardMaterial', { color: '#fff9e5', roughness: .9 })), h('mesh', { position: [.36, .12, 0], castShadow: true }, h('sphereGeometry', { args: [.25, 16, 12] }), h('meshStandardMaterial', { color: '#e5d4ae' })), h('mesh', { position: [.48, .18, .12] }, h('sphereGeometry', { args: [.04, 10, 8] }), h('meshBasicMaterial', { color: '#1c2630' })), h('mesh', { position: [.48, .18, -.12] }, h('sphereGeometry', { args: [.04, 10, 8] }), h('meshBasicMaterial', { color: '#1c2630' })) ); }
function QualityObserver({ controller }) { useFrame((_, delta) => controller.observe(delta)); return null; }
function GameCanvas({ viewModel, onPlatformSelect, quality, controller }) { return h(Canvas, { className: 'canvas', shadows: true, camera: { position: [15, 17, 25], fov: 48 }, dpr: quality.pixelRatio, gl: { antialias: true }, 'data-testid': 'game-canvas' }, h(QualityObserver, { controller }), h(RiverScene), h(PlatformField, { platforms: viewModel.platforms, onSelect: onPlatformSelect }), h(SheepAvatar, { viewModel })); }

function Hud({ viewModel, onStart, onRestart, onMute, showClear }) { const status = viewModel.phase === 'ready' ? '准备出发' : viewModel.phase === 'game-over' ? '生命耗尽，挑战结束' : viewModel.feedback === 'splash' ? '掉进水里了，回到起点！' : '发光木板可跳'; return h(React.Fragment, null,
  h('header', { className: 'hud' }, h('h1', null, '🐑 小羊过河'), h('div', { className: 'metrics' }, h('span', { className: 'metric' }, `关卡 ${viewModel.levelNumber}`), h('span', { className: 'metric' }, `生命 ${'♥'.repeat(viewModel.lives)} (${viewModel.lives})`), h('span', { className: 'metric' }, `分数 ${viewModel.score}`), h('span', { className: 'metric' }, `最高 ${viewModel.highScore}`)), h('button', { className: 'icon-button', onClick: onMute, 'data-testid': 'game-mute-button', 'aria-label': viewModel.muted ? '开启音效' : '静音' }, viewModel.muted ? '🔇' : '🔊')),
  h('div', { className: 'sr-only', id: 'game-status-live-region', 'data-testid': 'game-status-live-region', 'aria-live': 'polite' }, status),
  h('div', { className: 'overlay' }, viewModel.phase === 'ready' ? h('section', { className: 'card' }, h('h2', null, '踩着漂移木板到达对岸'), h('p', null, '点击金色发光的木板前进。木板会漂移，落地时没踩稳就会掉水并失去一条生命。'), h('button', { className: 'primary', onClick: onStart, 'data-testid': 'game-start-button' }, '开始游戏')) : null, viewModel.phase === 'game-over' ? h('section', { className: 'card' }, h('h2', null, '本局结束'), h('p', null, `最终分数：${viewModel.score}，到达关卡：${viewModel.levelNumber}`), h('button', { className: 'primary', onClick: onRestart, 'data-testid': 'game-restart-button' }, '再玩一次')) : null, showClear ? h('div', { className: 'toast', role: 'status' }, '过关！继续前进') : null),
  viewModel.phase !== 'ready' && viewModel.phase !== 'game-over' ? h('p', { className: 'hint' }, status) : null
); }

function supportsWebGL() { try { const canvas = document.createElement('canvas'); return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch { return false; } }
function GameApp() { const [snapshot, setSnapshot] = useState(null); const [quality, setQuality] = useState({ pixelRatio: Math.min(window.devicePixelRatio || 1, 2), particles: true }); const [webglOk] = useState(() => supportsWebGL()); const serviceRef = useRef(); const qualityController = useMemo(() => new RenderQualityController(setQuality), []);
  useEffect(() => { if (!webglOk) return undefined; const service = new GameSessionService(setSnapshot); serviceRef.current = service; return () => service.dispose(); }, [webglOk]);
  if (!webglOk) return h('div', { className: 'app' }, h(ErrorOverlay, { onReload: () => location.reload() }));
  if (!snapshot) return null;
  const { viewModel } = snapshot; const showClear = viewModel.feedback === 'level-clear'; const dispatch = (action) => serviceRef.current?.dispatch(action);
  return h('div', { className: 'app' }, h(Hud, { viewModel, showClear, onStart: () => dispatch({ type: 'START' }), onRestart: () => dispatch({ type: 'RESTART' }), onMute: () => dispatch({ type: 'TOGGLE_MUTE' }) }), h('section', { className: 'stage', 'aria-label': '3D 河流场景' }, h(ErrorBoundary, null, h(GameCanvas, { viewModel, onPlatformSelect: (platformId) => dispatch({ type: 'SELECT_PLATFORM', platformId }), quality, controller: qualityController })))); }

createRoot(document.getElementById('root')).render(h(GameApp));
