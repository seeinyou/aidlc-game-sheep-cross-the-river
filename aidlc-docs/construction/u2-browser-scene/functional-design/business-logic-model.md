# U2 浏览器体验逻辑模型

## 会话与单向数据流

1. `GameApp` 创建 `GameSessionService(createInitialState(seed))`，订阅其快照，并将快照转换为 U1 `toViewModel(state)`。
2. HUD 与 R3F 场景接收同一个只读 ViewModel。
3. HUD 按钮调用 service `dispatch`；R3F 平台命中只调用 `dispatch({ type: 'SELECT_PLATFORM', platformId })`。
4. service 执行 `reduce`、替换内部 state、发布 ViewModel，然后依序处理 effects：音效、toast、splash/announcement。
5. UI 从不反向写入领域 state；视图重新渲染只由 service 发布驱动。

## 帧调度与动画

- 会话启动后记录性能基准时间；每个 RAF 计算不倒退的 `elapsedMs` 并 dispatch `TICK`。
- 仅在 `playing` 或 `jumping` 且 document 可见时保留 RAF。
- R3F 帧回调可根据 `jump.startedAtMs` / `endsAtMs` 插值小羊位置，并以正弦高度形成抛物线；落点仍由 reducer 的 TICK 结算。
- `level-clear` toast 从 U1 clear 效果或 feedback 触发，显示约 1 秒；U1 已在状态上切换到下一关，因此 UI 将其作为非阻塞表现层。

## 选择木板流程

1. PlatformField 从 ViewModel 提取每个木板姿态和 `selectable`。
2. 可选木板渲染金色轮廓/发光；指针进入时上升少量，指针离开时恢复。
3. 可选平台点击向 GameApp 发送平台 ID；不可选平台不派发动作。
4. GameApp 将动作传入 SessionService；U1 返回成功 jump 或安全 reject，UI 通过 effects/feedback 更新状态提示。

## 音效流程

1. 用户首次点击开始/有效可交互动作时，service 调用 `AudioService.unlock`。
2. 每个 `PLAY_SOUND` 效果只交给 AudioService；其根据 `muted` 和可用性决定是否产生音调。
3. AudioService 以短振荡器包络模拟反馈；节点结束后断开。
4. 任何异常均变为 internal silent flag，不传播到 UI 或领域状态。

## 错误、可见性与重玩流程

- WebGL 预检失败直接渲染安全错误覆盖；R3F 渲染错误由 ErrorBoundary 转为同类覆盖。
- 页面隐藏：service 停止 RAF；可见：重新开始单条 RAF 链，保留领域 elapsedMs 单调性。
- RESTART：先取消当前 session 计时/过渡副作用，然后 dispatch U1 RESTART，重新开始必要帧调度；不创建第二会话。
- 卸载：unsubscribe、dispose service、释放 audio 和 R3F 资源；所有 listener 都有对称 remove。
