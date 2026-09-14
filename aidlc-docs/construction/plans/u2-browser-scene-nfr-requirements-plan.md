# U2 浏览器体验与 3D 场景：NFR 需求计划

## 评估范围

U2 是静态托管的 React + React Three Fiber 浏览器应用，依赖固定版本的 CDN ES modules，负责 WebGL 渲染、浏览器生命周期、可访问 HUD、Web Audio 与安全降级。无后端、账户、远程 API、数据库、跨区域扩缩或服务器 SLA。

## 执行清单

- [x] 阅读已批准 U2 功能设计和 Security Baseline 约束。
- [x] 确认渲染性能、CDN 依赖来源、本地最高分和浏览器验证范围。
- [x] 生成 `nfr-requirements.md`，定义性能、可靠性、安全、可用性、可访问性和维护性要求。
- [x] 生成 `tech-stack-decisions.md`，记录精确运行时依赖、静态托管安全头和测试工具决策。
- [x] 验证 Security Baseline、PBT 与 U1 既有工具链的适用性。

## 需要确认的 NFR 决策

请在每个 `[Answer]:` 后填写一个选项字母；若选择 X，请在字母后补充具体偏好。

## 问题 1：渲染性能目标

在常见笔记本及现代移动设备上，首版 3D 场景应遵守何种目标？

A) 目标 60 FPS；若连续 2 秒低于 30 FPS，则自动降低像素比上限/粒子数量；动画循环仅在页面可见且游戏活动时运行（推荐）

B) 仅保证能渲染，不设帧率或降级策略

C) 要求固定 60 FPS，低于 60 FPS 即判定失败

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 问题 2：运行时 CDN 依赖来源

React、ReactDOM、Three.js 和 React Three Fiber 的生产模块应如何加载？

A) 使用 jsDelivr 的固定精确 ESM 版本；部署文档记录 CSP 精确来源与每个 CDN 资源的发布版本/完整性复核步骤（推荐）

B) 使用任意可用 CDN 和浮动 latest 版本

C) 将全部运行时库下载并作为本地 vendor 文件提交

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: C

## 问题 3：最高分持久化范围

非敏感最高分应如何保存？

A) 尽力写入 `localStorage`，key 固定且仅存数值；读取/写入失败时退回当前会话内存值（推荐）

B) 不持久化，刷新页面后最高分清零

C) 存储完整游戏状态以支持下次继续关卡

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 问题 4：浏览器验证范围

U2 实现后的最低浏览器验证应采用哪种方式？

A) 静态 HTTP 服务 + Playwright 自动冒烟测试，覆盖启动、平台点击、掉水/失败覆盖层、重玩、静音、WebGL 错误覆盖层与关键 `data-testid`（推荐）

B) 静态 HTTP 服务 + 人工冒烟检查

C) 只运行 Node U1 测试，不测试浏览器界面

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 审批

完成答案后，请明确批准本 U2 NFR 需求计划。获批后会生成 NFR 需求和技术栈决策文档。

[Plan Approval]: Approve
