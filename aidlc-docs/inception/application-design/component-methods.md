# 组件方法与类型契约

以下为高层接口；数值常量、完整数据结构和算法细节留待后续功能设计。

## 领域类型

```text
GamePhase = ready | playing | jumping | level-complete | game-over
GameAction = START | SELECT_PLATFORM | TICK | RESTART | TOGGLE_MUTE | ACKNOWLEDGE_EFFECT
Transition = { state: GameState, effects: GameEffect[] }
GameEffect = { type: string, payload?: object }
```

- `GameState` 至少包含：阶段、关卡号、种子、生命、分数、最高分、当前平台、活动跳跃、关卡定义、运行时间、静音状态和反馈信息。
- `LevelDefinition` 至少包含：起点、终点、木板定义、保证可达的主路径和难度参数。
- `GameViewModel` 是从 `GameState` 派生的只读渲染模型；包含每块木板的当前姿态和可选中状态。

## U1 方法

| 组件 | 签名 | 输入 | 输出 | 用途 |
|---|---|---|---|---|
| LevelFactory | `createLevel(levelNumber, seed)` | 正整数关卡、整数种子 | `LevelDefinition` | 生成可复现且可达的关卡。 |
| LevelFactory | `validateReachability(level)` | `LevelDefinition` | `boolean` | 验证至少一条到终点的合法路径。 |
| BoardKinematics | `getPlatformPose(platform, elapsedMs)` | 木板定义、非负毫秒 | `PlatformPose` | 计算当前世界坐标、旋转和承载范围。 |
| BoardKinematics | `canSupport(pose, worldPosition)` | 木板姿态、羊世界坐标 | `boolean` | 判断落地时是否被承载。 |
| GameReducer | `createInitialState(seed, highScore)` | 种子、非负最高分 | `GameState` | 创建 ready 状态。 |
| GameReducer | `reduce(state, action)` | 当前状态、合法动作 | `Transition` | 产生下一状态和声明式效果。 |
| GameReducer | `toViewModel(state)` | `GameState` | `GameViewModel` | 为 UI/R3F 派生只读渲染数据。 |
| ScorePolicy | `scoreJump(state)` | 有效游戏状态 | 非负整数 | 计算成功跳跃奖励。 |
| ScorePolicy | `scoreLevelClear(state)` | 通关状态 | 非负整数 | 计算通关与剩余生命奖励。 |
| ScorePolicy | `updateHighScore(highScore, score)` | 两个非负整数 | 非负整数 | 返回不小于两个输入的最高分。 |

## U2 方法

| 组件/服务 | 签名 | 输入 | 输出 | 用途 |
|---|---|---|---|---|
| GameSessionService | `start()` | 无 | `void` | 启动可见页面中的帧调度。 |
| GameSessionService | `dispatch(action)` | `GameAction` | `void` | 将 UI 或时钟动作交由 reducer。 |
| GameSessionService | `subscribe(listener)` | 快照监听函数 | 取消订阅函数 | 让 React 安全订阅只读视图模型。 |
| GameSessionService | `dispose()` | 无 | `void` | 取消帧、监听器、计时器和副作用资源。 |
| AudioService | `unlock()` | 无 | `Promise<void>` | 在用户手势后尝试初始化音频。 |
| AudioService | `play(effectName)` | 白名单效果名称 | `void` | 播放程序化短音或安全静默。 |
| AudioService | `setMuted(muted)` | 布尔值 | `void` | 更新音效开关。 |
| AudioService | `dispose()` | 无 | `void` | 关闭/断开音频资源。 |

## 接口规则

1. UI 只发送列入 `GameAction` 的动作；未知或时机不合法的动作由 reducer 忽略并可返回拒绝反馈。
2. R3F 指针事件只传递平台 ID，不得自行改变生命、分数、阶段或关卡。
3. `TICK` 携带单调递增时间；同一初始状态与相同行动序列必须产生相同 Transition。
4. 仅 `GameSessionService` 可执行浏览器副作用；Reducer 与评分/关卡/运动组件不得访问全局浏览器对象。
5. 错误消息进入用户界面前必须转换为通俗白名单文本，不传递异常对象或堆栈。
