# U2 领域实体与表现状态

## U2 消费的 U1 数据

| 数据 | 来源 | U2 使用方式 |
|---|---|---|
| `GameViewModel` | `toViewModel(GameState)` | HUD、场景、木板姿态、可选状态、小羊、起终点和受控反馈。 |
| `GameEffect[]` | `reduce` Transition | 音效、toast、splash 和 aria-live 公告。 |
| `GameAction` | U1 公开契约 | 仅由 UI/时钟构造并 dispatch。 |

## U2 会话快照

`SessionSnapshot` 包含：

- `viewModel`：最后一个只读 U1 ViewModel。
- `active`：会话是否已开始并允许帧调度。
- `documentVisible`：当前页面可见性。
- `audioReady` / `audioSilent`：音频能力状态，不影响 U1 `muted`。
- `sceneStatus`：`pending`、`ready` 或 `failed`。
- `clearPresentationUntil`：通关反馈展示的本地截止时刻。
- `statusMessageKey`：映射到 aria-live 的安全文案键。

## 表现状态

- `PlatformPresentation`：来自 ViewModel pose，加上 `selectable`、`hovered` 和 `visualElevation`。
- `SheepPresentation`：来自 ViewModel sheep 与可选 U1 jump；用于位置/跳跃弧线的纯视觉插值。
- `OverlayPresentation`：由 phase、feedback、sceneStatus 组合，确定 start、game-over、level-clear 或 error 覆盖层。
- `AudioPresentation`：`muted`（领域状态）与 `audioSilent`（能力失败）共同决定是否播声。

## UI 事件白名单

- `START_CLICKED → { type: 'START' }`
- `RESTART_CLICKED → { type: 'RESTART' }`
- `MUTE_TOGGLED → { type: 'TOGGLE_MUTE' }`
- `PLATFORM_SELECTED(platformId) → { type: 'SELECT_PLATFORM', platformId }`
- `FRAME_ADVANCED(elapsedMs) → { type: 'TICK', elapsedMs }`
- `RELOAD_REQUESTED → window.location.reload()`（不进入 U1）

除该列表外的 UI 事件不得创建领域动作。
