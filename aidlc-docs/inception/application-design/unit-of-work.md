# 单元工作定义

## 代码组织策略

生产应用保留 `index.html` 与单一 `game.js` ES module。`game.js` 内部以清晰注释和导出边界顺序组织：

1. U1 领域类型与纯函数：LevelFactory、BoardKinematics、ScorePolicy、GameReducer。
2. U2 浏览器服务与 React/R3F 组件：AudioService、GameSessionService、ErrorBoundary、GameApp、GameCanvas、场景/HUD。
3. 运行时启动代码：固定版本 import map 模块加载后挂载 `GameApp`。

自动化测试位于 `test/`，按 `domain.example.test.js` 和 `domain.property.test.js` 分开，且不导入 R3F/DOM；集成冒烟流程在构建与测试阶段执行。

## U1：游戏领域逻辑

### 职责

- 生成固定种子和关卡编号下可复现、至少一条路径可达的关卡。
- 计算木板漂移姿态、承载范围与有效落点。
- 使用纯 reducer 管理 `ready`、`playing`、`jumping`、`level-complete`、`game-over` 状态转换。
- 计算跳跃/通关/生命奖励、生命限制和会话最高分。
- 输出声明式效果，不访问浏览器 API 或执行实际副作用。

### 输入与输出边界

- **输入**：种子、关卡编号、前一 `GameState`、白名单 `GameAction` 和单调时钟。
- **输出**：`LevelDefinition`、`PlatformPose`、`Transition`、`GameViewModel` 和 `GameEffect`。
- **禁止项**：DOM、React、Three.js/R3F、`requestAnimationFrame`、Web Audio、`localStorage`、网络调用。

### 验收结果

- 示例测试覆盖开始、合法/非法选择、跳跃、掉水、通关、生命耗尽和重玩状态。
- PBT 覆盖可达性、确定性、位置边界、合法状态序列、生命范围、得分单调性、状态模型等适用性质。
- U2 仅需根据 U1 公开接口即可绘制并驱动一局游戏。

## U2：浏览器体验与 3D 场景

### 职责

- 使用 React 管理 HUD、覆盖层、按钮、焦点、`aria-live` 状态、错误提示和静音控制。
- 使用 React Three Fiber 以程序化几何体渲染河面、两岸、漂移木板、小羊、灯光与特效。
- 将鼠标/触摸平台命中映射为白名单 `SELECT_PLATFORM` 动作。
- 管理帧、页面可见性、可选会话最高分、程序化音效与卸载/重玩清理。
- 将 R3F/音频/存储异常安全降级为通俗提示或静音，而不影响领域规则。

### 输入与输出边界

- **输入**：U1 的 `GameViewModel`、`GameEffect` 和公开 action 契约；用户输入及浏览器生命周期事件。
- **输出**：视觉帧、UI 状态、受控音效、白名单领域动作。
- **禁止项**：直接变更 `GameState`、复制评分/可达性/落点算法、显示原始错误/堆栈。

### 验收结果

- 能由 U1 状态驱动开始、跳跃、掉水、通关、失败、重玩和静音可见体验。
- 页面在静态服务中响应式可用；关键按钮可聚焦；WebGL 或音频失败安全降级。
- 重玩、卸载和错误恢复不保留重复帧循环、事件监听器或音频节点。

## 交付方式与所有权

- 单一实现者按顺序交付 U1 后 U2；每单元均有独立测试和审查检查点。
- U1 成为 U2 的阻塞依赖；不得为快速实现 U2 而绕过或复制其领域逻辑。
- 最后在静态 HTTP 服务中执行跨单元浏览器冒烟验证。
