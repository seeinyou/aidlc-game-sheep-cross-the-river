# 组件设计

## 设计概览

生产运行时由 `index.html` 与单个 `game.js` ES module 构成。`game.js` 内部按职责分隔 U1 纯领域逻辑和 U2 浏览器体验。React 负责 HUD、覆盖层和可访问状态；React Three Fiber（R3F）在 React 树中声明式渲染 Three.js 场景。所有运行时包使用精确版本的可信 CDN ES module。

## U1：游戏领域逻辑

### LevelFactory

- **目的**：针对关卡编号和种子创建确定性的、可达的关卡定义。
- **职责**：生成木板序列、漂移参数、难度参数、起终点和已验证的主路径。
- **接口**：`createLevel(levelNumber, seed) -> LevelDefinition`。
- **边界**：不访问 DOM、时间、音频、React 或 Three.js。

### BoardKinematics

- **目的**：在给定游戏时间计算木板的当前位置与承载区域。
- **职责**：将静态木板定义映射为有界的 `PlatformPose`；回答落点是否被目标木板承载。
- **接口**：`getPlatformPose(platform, elapsedMs) -> PlatformPose`、`canSupport(pose, worldPosition) -> boolean`。
- **边界**：纯计算，不决定玩家状态或播放动画。

### GameReducer

- **目的**：作为可测试的游戏状态机，接收命令并产出下一状态与效果事件。
- **职责**：处理开始、目标选择、时间推进、跳跃结算、掉水、通关、重玩和静音；维护生命、分数、关卡和状态阶段。
- **接口**：`reduce(gameState, action) -> Transition`，其中 `Transition` 包含 `state` 和 `effects`。
- **边界**：不执行副作用；只发出如 `playSound`、`showSplash`、`announce` 的声明式效果。

### ScorePolicy

- **目的**：集中定义跳跃、通关和生命奖励的分数规则。
- **职责**：计算分数增量和会话最高分；保证不会产生负分。
- **接口**：`scoreJump(state) -> number`、`scoreLevelClear(state) -> number`、`updateHighScore(previousHighScore, score) -> number`。
- **边界**：不读取/写入浏览器存储。

## U2：浏览器体验与 3D 场景

### GameApp

- **目的**：React 根组件，组装 HUD、覆盖层、R3F 场景和会话编排。
- **职责**：订阅 GameSessionService 快照，将用户操作转换为领域动作，渲染当前游戏阶段。
- **接口**：接收无参数的组合根；将只读 `GameViewModel` 下传给子组件。

### GameCanvas

- **目的**：R3F Canvas 边界，声明透视相机、灯光和场景树。
- **职责**：将 `GameViewModel` 映射为河面、两岸、木板、小羊、特效；在卸载时通过 R3F 生命周期释放资源。
- **接口**：`<GameCanvas viewModel onPlatformSelect />`。
- **边界**：不计算规则或直接修改领域状态。

### RiverScene

- **目的**：渲染程序化河流、两岸、雾/环境和光照。
- **职责**：提供可辨识的空间深度和响应式视角。
- **接口**：`<RiverScene level />`。

### PlatformField

- **目的**：渲染移动木板并将指针命中事件上送。
- **职责**：使用当前 `PlatformPose` 显示可达/不可达提示；仅报告被点击的平台 ID。
- **接口**：`<PlatformField platforms selectableIds onSelect />`。

### SheepAvatar

- **目的**：使用基础几何体和材质构成小羊，并呈现跳跃/掉水/回到起点动画。
- **职责**：消费当前羊位置和动画阶段；不判断落点是否成功。
- **接口**：`<SheepAvatar pose animationPhase />`。

### GameHudAndOverlay

- **目的**：展示标题、说明、关卡、生命、分数、最高分、开始/重玩、静音和失败/通关反馈。
- **职责**：为按钮提供键盘焦点、触摸操作、`aria-live` 状态文字和通俗错误提示。
- **接口**：`<GameHudAndOverlay viewModel onStart onRestart onMute />`。

### GameSessionService

- **目的**：将浏览器时钟、React 调度和领域 reducer 编排为一个会话。
- **职责**：保持内部状态快照，按活动/可见生命周期调度帧，将 UI 命令发送给 reducer，执行非敏感会话最高分读取/写入，并向 AudioService/通知层分发效果。
- **接口**：`start()`、`dispatch(action)`、`subscribe(listener)`、`dispose()`。
- **边界**：唯一允许使用 `requestAnimationFrame`、`visibilitychange`、`localStorage` 和效果分发的组件。

### AudioService

- **目的**：提供受用户交互解锁且可静音的程序化 Web Audio 反馈。
- **职责**：按效果事件播放短音；在不支持/权限失败时静默降级；释放 AudioContext/节点。
- **接口**：`unlock()`、`play(effectName)`、`setMuted(boolean)`、`dispose()`。

### ErrorBoundary

- **目的**：截获 React/R3F 渲染异常并显示安全的用户消息。
- **职责**：隐藏内部错误细节，保留重新加载/重玩动作。
- **接口**：`<ErrorBoundary fallback />`。

## 横切约束

- 所有外部模块来自固定版本、可信来源；生产 HTML 安全标头和完整性复核由静态托管说明定义。
- U1 为 PBT 核心，必须保持纯函数和可注入的种子/时间。
- U2 必须在 `dispose`/卸载时取消帧、事件监听器和音频资源。
- 无认证、API、网络服务、个人数据或远程持久化组件。
