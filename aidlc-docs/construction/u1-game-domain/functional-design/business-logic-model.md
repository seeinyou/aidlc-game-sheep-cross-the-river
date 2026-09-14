# U1 业务逻辑模型

## 1. 确定性关卡生成

### 输入与输出

输入 `(levelNumber, baseSeed)`，计算：

1. `difficultyLevel = min(levelNumber, 8)`。
2. `levelSeed = deriveSeed(baseSeed, levelNumber)`。
3. 从受限参数表获取木板数量、漂移速度、木板尺寸和横向偏移上限。
4. 以固定步长排列一条从 `start` 到 `goal` 的主路径；使用确定性伪随机数在受限横向范围内调整每个主路径木板。
5. 若 `levelNumber >= 2`，基于种子确定是否添加零或一条分叉；分叉最多从一个主路径节点发出，不改变主路径的可达性。
6. 执行 `validateReachability`；若失败，仅在确定性约束范围内调整/重新生成，直到主路径有效。

第 8 关之后继续用难度等级 8 的参数，但因 `levelNumber` 参与种子派生，木板布局仍按关卡变化。

## 2. 木板漂移运动学

对于每块木板，在时间 `t = elapsedMs / 1000`：

- `x = baseX + amplitudeX * sin(angularSpeed * t + phase)`
- `z = baseZ + amplitudeZ * cos(angularSpeed * t + phase)`
- `y` 为固定水面上方高度；旋转只用于视觉，不扩大承载区域。

姿态必须限制在预定义河流矩形内。`canSupport` 使用当前木板姿态的承载矩形与小羊落点比较，并保留安全边距，防止边缘命中不稳定。

## 3. 跳跃流程

1. `SELECT_PLATFORM` 仅在 `phase = playing` 时处理。
2. 若 `platformId` 不存在、不是当前静态邻接的前进目标、或当前阶段不允许，状态不变，返回 `reject` 反馈。
3. 合法选择建立固定时长的 `JumpState`：记录发起时间、起点、目标平台 ID 和预先定义的目标世界坐标。
4. reducer 接收 `TICK` 并在 `jumpEndMs` 前保持 `jumping`；R3F 可从 JumpState 视觉插值抛物线，但不改变领域结算。
5. 到达/超过 `jumpEndMs` 时，通过 `getPlatformPose(target, elapsedMs)` 与 `canSupport` 在**落地瞬间**判定。
6. 成功：小羊承载位置更新为目标平台，分数加 10；如果目标连接 goal，则进入通关结算。
7. 失败：进入掉水处理。

## 4. 掉水与失败

掉水可由落地不承载触发。处理顺序：

1. 添加 `SPLASH`、`PLAY_SOUND(splash)` 和受控反馈效果。
2. `lives = max(0, lives - 1)`；`score` 不变；`muted`、`levelNumber`、`levelSeed` 和 `level` 不变。
3. 若生命大于 0，小羊回 start、清空 jump、`phase = playing`。
4. 若生命为 0，小羊标记 falling/停在安全表现状态、清空 jump、`phase = game-over`，并发布最终结果反馈。

## 5. 通关与下一关

目标连接达成后：

1. 加通关奖励 `100 + 25 * lives`，更新会话最高分。
2. 发布 `PLAY_SOUND(clear)` 和通关反馈；短暂设置 `phase = level-complete`。
3. 后续合法 `TICK` 或确认动作创建 `levelNumber + 1` 的确定性关卡；小羊回新 start，保留 lives、score、highScore 和 muted，进入 `playing`。

首版可将 level-complete 过渡定义为固定、短暂的效果窗口；它不得等待或依赖 UI 回调才能生成下一关。

## 6. 开始、重玩和静音

- `START` 仅从 ready 生效：创建第 1 关、3 生命、0 分与 `playing`，并发出 start 效果。
- `RESTART` 可从任意阶段生效：使用 `baseSeed` 创建第 1 关、重置 lives/score/elapsedMs/jump；保留 `highScore` 和 `muted`。
- `TOGGLE_MUTE` 可在任意阶段生效，且不改变任何其他领域字段。

## 7. 视图模型派生

`toViewModel(GameState)` 以同一 `elapsedMs` 计算每个平台姿态，派生可选中平台 ID、羊的逻辑位置、HUD 数值和受控反馈。该操作为纯函数，不能改变 GameState。
