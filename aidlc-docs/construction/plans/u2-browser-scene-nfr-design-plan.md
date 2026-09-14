# U2 浏览器体验与 3D 场景：NFR 设计计划

## 设计目标

将已批准的 U2 NFR 落实为逻辑模式：帧率监测与单向视觉降级、同源本地 vendor 与 CSP、集中浏览器副作用/清理、localStorage 安全回退、WebGL 错误边界、可访问性和 Playwright 冒烟验证。无服务端、队列、缓存、重试、数据库或分布式扩缩组件。

## 执行清单

- [x] 阅读 U2 NFR 需求和技术栈决策。
- [x] 确认视觉降级恢复策略和本地 vendor 生成策略。
- [x] 生成 `nfr-design-patterns.md`，定义性能、生命周期、安全、可访问性和测试模式。
- [x] 生成 `logical-components.md`，定义性能控制器、会话服务、vendor/headers 和测试逻辑组件。
- [x] 验证 Security Baseline、U1 PBT 边界和 U2 NFR 的可追溯性。

## 需要确认的 NFR 设计选择

请在每个 `[Answer]:` 后填写一个选项字母；若选择 X，请在字母后补充具体偏好。

## 问题 1：性能降级后的恢复策略

检测到连续低帧率并降低像素比/粒子数量后，性能恢复时应如何处理？

A) 本次会话维持降级后的质量，直到玩家重玩或刷新页面；避免质量反复抖动（推荐）

B) 连续 10 秒高于 50 FPS 后逐级恢复质量

C) 永不自动降级，只在玩家设置中手动选择质量

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 问题 2：本地 vendor 生成策略

从 npm lockfile 生成本地运行时库时，应使用何种发布形态？

A) 使用精确版本 npm 包的浏览器 ESM 发布入口及其所需同源依赖文件，保留包目录结构；脚本生成 import map 和 manifest（推荐）

B) 将所有运行时库打成单个手工拼接的 vendor 文件

C) 不生成 vendor，开发时直接从 node_modules 提供浏览器模块

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 审批

完成答案后，请明确批准本 U2 NFR 设计计划。获批后会生成 NFR 设计模式和逻辑组件文档。

[Plan Approval]: Approve
