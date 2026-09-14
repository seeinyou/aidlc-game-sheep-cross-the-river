# 服务与编排设计

## GameSessionService：主编排服务

### 责任

1. 在启动、重玩或关卡切换时创建/替换领域 `GameState`。
2. 将按钮、R3F 平台命中和动画时钟转换为允许的 `GameAction`。
3. 调用 `GameReducer.reduce`，发布新的 `GameViewModel`，并按顺序分发 `GameEffect`。
4. 仅在页面可见且会话活动时调度 `requestAnimationFrame`；隐藏页面时暂停调度。
5. 使用受保护的 `localStorage` 操作维护非敏感会话最高分；任何异常安全回退至内存值。
6. 在重启、卸载或错误边界恢复时调用 `dispose`，取消帧、移除监听器和关闭 AudioService。

### 编排模式

- **单向流**：输入 → `dispatch` → reducer Transition → ViewModel → React/R3F 渲染；effects → Audio/反馈通知。
- **无反向状态写入**：场景组件和 HUD 不直接编辑 `GameState`。
- **失败安全**：未知动作、音频不可用、存储异常和渲染异常均不得让游戏规则失效或暴露内部细节。

## R3F 场景编排

`GameCanvas` 在 `ErrorBoundary` 内建立 `<Canvas>`。`RiverScene`、`PlatformField` 和 `SheepAvatar` 从相同 `GameViewModel` 接收数据，保持声明式视觉树：

- `PlatformField` 将对象 `onClick` 命中转换为 `onPlatformSelect(platformId)`。
- 组件可在 R3F 帧回调中进行纯视觉插值，但不改变领域状态。
- 场景生命周期依赖 React/R3F 卸载，补充由 `GameSessionService.dispose` 清除会话级帧和事件。

## AudioService：效果服务

- 只接受白名单效果：`start`、`jump`、`splash`、`clear`、`reject`。
- 在用户开始游戏或首次可交互操作时调用 `unlock`；失败后维持无声模式，不重试循环。
- `muted` 为真时拒绝创建新的声音节点。
- 所有节点使用短包络并在结束后断开，`dispose` 关闭 AudioContext（若支持）。

## 错误处理与安全边界

- `ErrorBoundary` 包裹 React/R3F UI；显示“场景暂时无法显示，请重新开始或刷新页面”等安全文本。
- 资源加载与初始化失败以白名单错误代码映射，不将 CDN URL、异常消息或堆栈展示给玩家。
- 不提供网络 API、认证、远程存储或用户文本输入；因此 API 验证、认证、限流和服务器日志服务不在本应用范围。
