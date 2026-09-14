# U2 浏览器体验业务规则

## U1 边界与输入验证

1. U2 只发送 `START`、`RESTART`、`TOGGLE_MUTE`、`SELECT_PLATFORM` 和单调 `TICK` 动作；不直接更改 `GameState`、生命、分数、关卡、可达性或落点。
2. `PlatformMesh` 仅对 `viewModel.selectable` 为真的平台调用 `onPlatformSelect(id)`；U1 仍是最终验证者。
3. 跳跃期间平台点击被 UI 禁用或忽略；任何剩余命中也只能被 U1 安全拒绝。
4. 视图状态只从 `toViewModel` 派生；不得维护第二份领域真相来源。

## 玩家反馈与场景规则

1. 可选木板必须有金色边缘/轻微发光和悬停抬升；不可选木板维持正常材质。
2. 在 `feedback = level-clear` 时显示约 1 秒庆祝 toast/粒子；这只是视觉窗口，U1 已自动推进关卡且不等待 UI 点击。
3. 掉水显示水花/短暂视觉扰动；game-over 显示最终分数、到达关卡与再玩按钮。
4. 小羊跳跃使用 U1 `jump` 的开始/结束时间插值；视觉插值不得影响落地判定。
5. 相机和画布随容器/窗口变化调整，HUD 在窄屏仍可读。

## 音效与静音规则

1. 初始 `muted = false`；仅在用户点击开始或首个可交互动作时调用 `AudioService.unlock()`。
2. AudioService 只处理白名单：`start`、`jump`、`splash`、`clear`、`reject`。
3. 音频初始化/播放失败进入无声模式；不得反复弹窗、重试循环或中断游戏。
4. 静音时不创建新音频节点；切换静音不改变领域规则、分数或关卡。

## 生命周期和资源清理

1. GameSessionService 仅在页面可见且会话活动时调度一条 `requestAnimationFrame` 链；每帧向 U1 发送单调 `TICK`。
2. `visibilitychange` 到隐藏时取消帧；恢复可见时从当前时间继续调度，不能倒退 elapsedMs。
3. 重玩、组件卸载和错误恢复均调用 `dispose`：取消帧、移除 window/document 监听器、清除过渡计时器、断开音频节点并关闭 AudioContext（可用时）。
4. R3F 组件仅拥有场景几何体/材质；通过 React 卸载释放，不得保留外部 Three.js 引用。

## WebGL 与错误降级

1. 初始化前检测 WebGL 可用性；不支持时显示 `game-error-overlay`，说明需要支持 WebGL 的现代浏览器。
2. React/R3F 异常由 ErrorBoundary 捕获；回退文字不显示 URL、堆栈、依赖版本、异常消息或内部路径。
3. 回退界面有 `game-reload-button`，调用页面 reload；不提供 2D 替代游戏。
4. localStorage 读/写最高分失败仅使用会话内值；不显示技术错误。

## Security Baseline 适用规则

- SECURITY-04：静态托管阶段必须设置 CSP、HSTS、nosniff、防嵌入和 Referrer-Policy；U2 不得要求 `unsafe-eval`。
- SECURITY-09：无默认凭证、无调试页面、用户显示错误经过白名单映射。
- SECURITY-10/13：固定官方 CDN 版本、完整性复核、lockfile、审计和 SBOM；不加载模型/贴图等额外外部资源。
- SECURITY-11/15：输入白名单、错误边界、资源清理和失败不改变领域规则。
- 其余 Security Baseline 规则无后端/API/身份/存储资源，继续为 N/A。
