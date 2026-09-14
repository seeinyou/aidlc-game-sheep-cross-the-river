# U1 领域实体

## 聚合根：GameState

`GameState` 是单局游戏的唯一领域事实来源，且只能由纯 reducer 替换为新的状态值。

| 字段 | 含义 | 约束 |
|---|---|---|
| `phase` | `ready`、`playing`、`jumping`、`level-complete` 或 `game-over` | 互斥；仅允许业务规则表中的转换。 |
| `levelNumber` | 当前关卡编号 | 正整数。 |
| `baseSeed` | 重玩的初始确定性种子 | 整数；重玩恢复此值。 |
| `levelSeed` | 当前关派生种子 | 由 `baseSeed` 和 `levelNumber` 唯一派生。 |
| `lives` | 剩余生命 | 整数，范围 0–3。 |
| `score` | 当前局得分 | 非负整数。 |
| `highScore` | 会话最高分 | 非负整数，始终不小于 `score` 的历史最大值。 |
| `muted` | 音效开关 | 布尔值；掉水和重玩时保持。 |
| `elapsedMs` | 当前关单调运行时间 | 非负；只可随合法 `TICK` 增加。 |
| `level` | 当前 `LevelDefinition` | 必须通过可达性验证。 |
| `sheep` | 小羊当前位置与承载位置 | 位于 start、合法平台、跳跃中或 falling。 |
| `jump` | 活动跳跃或空 | 仅在 `jumping` 阶段存在。 |
| `feedback` | 最近的玩家可见反馈 | 只包含白名单反馈类型与安全文本键。 |

## LevelDefinition

| 实体 | 内容 | 规则 |
|---|---|---|
| `levelNumber` | 关卡编号 | 用于难度等级：`min(levelNumber, 8)`。 |
| `seed` | 当前关种子 | 确定性输入。 |
| `start` / `goal` | 起终点世界坐标 | 分别位于两岸，不能重叠。 |
| `platforms` | 木板集合 | 平台 ID 唯一；每个有漂移参数和承载尺寸。 |
| `mainPathIds` | 保证可达路径 | 非空、无重复，首端可从 start 到达，末端可到 goal。 |
| `branchIds` | 可选风险分叉 | 第 1 关为空；后续至多一条分叉；不必能到 goal。 |
| `difficulty` | 有界难度参数 | 包含速度、尺寸、横向偏移和分叉开关。 |

## Platform 与 PlatformPose

- `Platform`：静态身份、基准位置、半宽/半深、漂移振幅、频率、相位和路径邻接信息。
- `PlatformPose`：在 `elapsedMs` 时刻的世界位置、朝向和承载矩形。
- 平台静态参数不会在一关内改变；姿态只由平台和时间决定。

## 动作、转换与效果

### GameAction

- `START`：从 `ready` 开始第 1 关。
- `SELECT_PLATFORM { platformId }`：尝试跳向一个平台。
- `TICK { elapsedMs }`：提供单调的当前关时间。
- `RESTART`：在任意阶段开始新一局。
- `TOGGLE_MUTE`：翻转静音状态。
- `ACKNOWLEDGE_EFFECT { effectId }`：可选地清除已消费的反馈。

### Transition

`Transition = { state: GameState, effects: GameEffect[] }`。Reducer 对每个动作返回新的状态值及零个或多个声明式效果。

### GameEffect

- `PLAY_SOUND { name }`，其中 name 仅能为 `start`、`jump`、`splash`、`clear`、`reject`。
- `SHOW_FEEDBACK { key }`，其中 key 为受控的 UI 文案键。
- `SPLASH { position }`。
- `ANNOUNCE { key }`。

效果不包含异常对象、URL、未验证字符串或浏览器调用。

## 关系与不变量

- 一个 `GameState` 恰好拥有一个 `LevelDefinition` 和一个 `SheepState`。
- `JumpState` 引用一个当前关存在、且在发起时可达的目标平台。
- `mainPathIds` 描述的是静态合法顺序；实际跳跃是否成功取决于落地时的 `PlatformPose`。
- U1 实体全部为可序列化的纯数据，但首版不要求持久化或反序列化行为。
