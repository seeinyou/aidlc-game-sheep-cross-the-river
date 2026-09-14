# U2 前端组件设计

## React 组件树

```text
ErrorBoundary
└─ GameApp
   ├─ GameHudAndOverlay
   │  ├─ Header / score panel
   │  ├─ Start overlay or Game-over overlay
   │  ├─ Level-clear toast
   │  ├─ Mute button
   │  └─ Accessible live status
   └─ GameCanvas (R3F Canvas)
      ├─ RiverScene
      ├─ PlatformField
      │  └─ PlatformMesh (one per ViewModel platform)
      ├─ SheepAvatar
      └─ SplashEffect / celebration particles
```

## 组件契约

| 组件 | Props / 本地状态 | 交互职责 |
|---|---|---|
| `GameApp` | `GameSessionService` 快照、sceneError、clearUntilMs | 创建/销毁会话，连接所有动作，提供错误边界。 |
| `GameHudAndOverlay` | `viewModel`、`onStart`、`onRestart`、`onToggleMute`、`onReload` | 显示 HUD/覆盖层；按钮触发白名单动作。 |
| `GameCanvas` | `viewModel`、`onPlatformSelect`、`onSceneFailure` | 创建 R3F Canvas；向子树传递只读场景数据。 |
| `RiverScene` | `level` | 渲染程序化水面、两岸、光照、雾与相机环境。 |
| `PlatformField` | `platforms`、`onSelect` | 渲染木板；只将平台 ID 上送。 |
| `PlatformMesh` | `pose`、`selectable`、`onSelect` | 可选时提供金色边缘/发光与悬停抬升；无效平台不触发领域动作。 |
| `SheepAvatar` | `sheep`、`phase`、`jump` | 用基础几何体渲染小羊；仅显示，不判定成功。 |
| `SplashEffect` | `feedback` | 在 U1 splash 效果后播放短暂视觉粒子。 |
| `ErrorBoundary` | `fallback` | 截获 React/R3F 渲染错误并显示无内部细节的覆盖层。 |

## 稳定自动化定位

所有互动 DOM 元素采用稳定 `data-testid`：

- `game-start-button`
- `game-restart-button`
- `game-mute-button`
- `game-reload-button`
- `game-status-live-region`
- `game-error-overlay`
- `game-canvas`

R3F 平台使用稳定对象名称 `platform-{id}`；浏览器级自动化通过 Canvas 坐标/对象命中验证，不依赖动态 DOM ID。

## 可访问性

- HUD 使用语义标题、按钮和可读文本；生命同时显示心形图标和数字。
- `game-status-live-region` 使用 `aria-live="polite"` 播报开始、掉水、通关和失败。
- 说明明确“发光木板可跳”；发光不作为唯一提示，状态文本和可选动作反馈提供补充。
- 按钮有可见焦点、至少适合触摸的大小；Canvas 不承诺键盘选板，开始/重玩/静音按钮可键盘操作。
