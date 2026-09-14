# 组件依赖与通信设计

## 依赖方向

`GameApp → GameSessionService → GameReducer → LevelFactory / BoardKinematics / ScorePolicy`

`GameApp → ErrorBoundary → GameCanvas (R3F) → RiverScene / PlatformField / SheepAvatar`

`GameApp → GameHudAndOverlay`

`GameSessionService → AudioService`

### 数据流文字图

`玩家输入或动画时钟 → GameSessionService.dispatch → GameReducer → Transition(state, effects) → GameViewModel → React HUD 与 R3F 场景`。

`Transition.effects → AudioService 与 UI 反馈`。`PlatformField` 只能发出平台 ID；`GameHudAndOverlay` 只能发出开始、重玩和静音命令。

## 依赖矩阵

| 使用方 | 被使用方 | 关系 | 通信方式 |
|---|---|---|---|
| GameReducer | LevelFactory | 创建/切换关卡 | 同步纯函数调用 |
| GameReducer | BoardKinematics | 计算木板姿态和落点 | 同步纯函数调用 |
| GameReducer | ScorePolicy | 计算分数 | 同步纯函数调用 |
| GameSessionService | GameReducer | 推进领域状态 | 同步 reducer 调用 |
| GameSessionService | AudioService | 执行效果 | 异步但可忽略失败 |
| GameApp | GameSessionService | 获取状态与发送命令 | 订阅 + 命令 |
| GameCanvas | GameViewModel | 渲染三维状态 | React props |
| PlatformField | GameApp | 报告平台选择 | 回调携带平台 ID |
| GameHudAndOverlay | GameApp | 报告按钮动作 | 回调携带白名单动作 |
| ErrorBoundary | GameApp / GameCanvas | 捕获渲染失败 | React 错误边界 |

## 耦合与边界规则

- U1 不依赖 U2 或任何浏览器/渲染库；允许从 Node 测试运行器直接导入。
- U2 依赖 U1 的公开函数和只读类型，不能读取或写入内部可变状态。
- CDN 依赖仅在运行时入口中解析；领域测试使用锁定的本地开发依赖，避免测试依赖网络。
- `GameSessionService` 是浏览器副作用的单一拥有者；任何新增副作用都需要通过效果事件和服务边界审查。

## 错误与恢复流

1. **未知/非法动作**：Reducer 保持状态，返回可选 `reject` 效果；无生命或分数变动。
2. **音频不可用**：AudioService 进入无声模式；游戏继续运行。
3. **localStorage 不可用**：服务退回内存最高分；游戏继续运行。
4. **WebGL/R3F 渲染异常**：ErrorBoundary 显示受控提示；用户可刷新或重新开始；不暴露内部异常。
5. **卸载/重玩**：服务销毁帧和事件资源；R3F 释放画布资源；再建立新的会话。
