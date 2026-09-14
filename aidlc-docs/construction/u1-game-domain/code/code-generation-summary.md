# U1 游戏领域逻辑：代码交付摘要

## 创建的应用与配置文件

- `game-domain.js`：U1 纯领域模块，导出确定性种子/关卡、可达性验证、木板姿态与承载、评分、初始状态、纯 reducer 和只读视图模型。
- `package.json`：ESM、Node `>=24.3.0`、根级质量脚本和精确开发依赖。
- `package-lock.json`：npm 锁定依赖解析。
- `test/domain.example.test.js`：8 个玩家关键路径示例测试。
- `test/domain.property.test.js`：5 个 `fast-check` 性质测试，包含受限领域生成器和默认收缩/种子重现。
- `test/domain.performance.test.js`：1,000 次预热后 p95 性能门禁。
- `scripts/check.mjs`：U1 文件存在性及浏览器/渲染依赖禁止检查。
- `scripts/generate-sbom.mjs`：无额外依赖的 lockfile SBOM 生成器。
- `artifacts/sbom.json`：当前锁定依赖 SBOM（构建生成物）。

## 实现的故事与规则

- **US-02/US-03**：只允许前进主路径/风险分叉的选择；以落地时姿态判定承载；成功跳跃加 10。
- **US-04/US-05**：掉水扣生命、回到当前关起点；最后一命进入 game-over 并拒绝后续移动。
- **US-06**：主路径终点通关，加 100 + 每条剩余生命 25，进入使用确定性新布局的下一关；难度参数上限为第 8 关。
- **US-01/US-07 支持**：ready/start 契约、重玩保留最高分/静音并复位为第 1 关、静音领域动作。

## 公开 U1 API

`deriveSeed`、`createPrng`、`createLevel`、`validateReachability`、`getPlatformPose`、`canSupport`、`scoreJump`、`scoreLevelClear`、`updateHighScore`、`createInitialState`、`reduce`、`toViewModel`、`DOMAIN_CONSTANTS`。

## 实际工具与依赖版本

- Node.js：`v24.3.0`
- npm：`11.6.0`
- `fast-check`：`4.10.0`（官方 npm registry，精确锁定）

## 验证结果

- `npm ci --ignore-scripts`：通过。
- `npm run test:example`：8/8 通过。
- `npm run test:property`：5/5 通过；默认 shrinking 启用。
- `npm run test:performance`：通过；p95 分别为 createLevel `0.0039ms`、reduce `0.0002ms`、toViewModel `0.0017ms`，均低于 `5ms`。
- `npm run check`：通过；确认 U1 不导入浏览器或渲染 API。
- `npm audit --audit-level=high`：通过，0 个漏洞。
- `npm run sbom`：通过，生成包含 2 个锁定包的 `artifacts/sbom.json`。

## 合规状态

- **PBT**：示例测试与性质测试分层；覆盖可达性、确定性、姿态边界、状态/生命/得分范围和视图模型纯度。后续可扩充完整 stateful model oracle，以支持更复杂的 U2 集成。
- **Security**：无外部输入/浏览器依赖的纯领域边界已由静态检查验证；精确依赖、lockfile、审计与 SBOM 已实现。静态 HTML 安全标头与 CDN 完整性属于后续 U2/构建阶段。
