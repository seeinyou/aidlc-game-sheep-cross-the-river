# U2 NFR 逻辑组件

| 组件 | 责任 | 输入/输出 | 生命周期与验证 |
|---|---|---|---|
| RenderQualityController | 追踪帧间隔、2 秒低 FPS 窗口、一次性质量降级。 | R3F frame delta → pixel-ratio cap / particle budget。 | 重玩/刷新重置；单元/浏览器测试验证阈值和不抖动。 |
| GameSessionService | 单一 RAF 链、visibility、U1 action dispatch、effects、dispose。 | UI/时间 → U1 transition → snapshot/effects。 | unmount/restart/error 时 dispose；浏览器冒烟验证。 |
| AudioService | 手势解锁、白名单短音、静音/失败回退和节点清理。 | effect + muted → audible/silent result。 | dispose 断开节点；浏览器测试静音/无音频降级。 |
| HighScoreStore | 安全读取/验证/写入单一数值最高分。 | localStorage → nonnegative integer / memory fallback。 | storage 失败时无异常；浏览器初始化测试。 |
| WebGLGuard + ErrorBoundary | 预检 WebGL、捕获 R3F React 异常、展示安全 reload overlay。 | capability/error → scene status。 | failed 状态无内部详情；Playwright 模拟 WebGL 失败。 |
| VendorRuntimeBuilder | 从 lockfile npm 安装物复制 ESM 包、生成 import map/manifest/SHA-256。 | node_modules + lockfile → vendor directory artifacts。 | 每次依赖变动重建；检查无外网 import。 |
| StaticHeadersSpec | 维护 CSP/HSTS/nosniff/frame/referrer 规则的通用规范。 | header rules → deploy documentation。 | 静态检查 header 值；托管部署前人工适配。 |
| StaticServer | 提供同源 index、game、vendor 和测试资源。 | local files → HTTP response。 | Playwright 启动/停止；无应用 API。 |
| Playwright Smoke Suite | 验证浏览器关键玩家路径和安全降级。 | static server + browser → pass/fail artifacts。 | 实现后在本地/CI 命令中运行。 |

## 组件交互顺序

1. VendorRuntimeBuilder 生成本地运行时包及 import map/manifest。
2. StaticServer 返回同源页面与安全头配置说明。
3. WebGLGuard 通过后 GameApp 创建 GameSessionService 与 R3F Canvas。
4. GameSessionService 发布 U1 ViewModel；RenderQualityController 只调节视觉预算。
5. HUD/R3F 输入进入 service；effects 分发给 AudioService/展示状态。
6. Playwright Smoke Suite 验证成功路径和 ErrorOverlay；退出时服务与场景释放资源。

## 不适用逻辑组件

缓存、CDN、负载均衡、服务端队列、数据库、重试/断路器、分布式锁、跨区域故障转移、身份和远程日志/告警均为 N/A：首版是同源静态单页应用。
