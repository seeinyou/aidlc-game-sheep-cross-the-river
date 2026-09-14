# U1 游戏领域逻辑：代码生成计划

## 单元上下文

- **单元**：U1 游戏领域逻辑。
- **实现故事**：主要覆盖 US-02 至 US-06；为 US-01 提供 start 状态契约，并为 US-07 提供 restart/high-score/静音领域规则。
- **依赖**：无前置代码单元；U2 后续仅消费 U1 的公开领域函数和只读视图模型。
- **服务边界**：无 API、数据库、持久化或部署服务。应用代码必须位于工作区根目录，测试在 `test/`，文档摘要在 `aidlc-docs/construction/u1-game-domain/code/`。

## 执行步骤

- [x] **步骤 1：确认本地工具与精确依赖版本**
  - 检查本机 Node/npm 版本；从官方 npm registry 获取 `fast-check` 的可用精确版本。
  - 不猜测版本；记录实际采用版本及其用途。

- [x] **步骤 2：建立根级 npm 项目与质量命令**
  - 创建根级 `package.json`，声明 Node 引擎、ESM、精确 `fast-check` 开发依赖和脚本：`test`、`test:example`、`test:property`、`test:performance`、`check`、`sbom`。
  - 使用 npm 创建并提交 `package-lock.json`；不加入未使用依赖。

- [x] **步骤 3：实现 U1 纯领域模块**
  - 在根级创建 `game-domain.js`，实现并导出确定性 PRNG/关卡生成、可达性验证、木板姿态/承载检查、初始状态、纯 reducer、评分策略和只读视图模型。
  - 落实主路径+可选风险分叉、8 关难度上限、落地瞬间判定、10/100/25 计分和重玩语义。
  - 禁止 DOM、Three.js、React、Web Audio、`localStorage`、网络或模块级可变会话状态。

- [x] **步骤 4：实现 U1 示例测试**
  - 创建 `test/domain.example.test.js`，覆盖启动、合法/非法选择、成功落地、掉水续关、最后一命失败、通关/升级、重玩和静音/最高分规则。
  - 为各场景使用稳定的固定种子和时间，明确断言 Transition 状态与效果。

- [x] **步骤 5：实现 U1 属性测试与领域生成器**
  - 创建 `test/domain.property.test.js`，集中定义约束的关卡号、种子、时间、动作序列和平台领域生成器。
  - 使用 `fast-check` 覆盖关卡可达性、确定性、姿态边界、评分/生命范围、视图模型纯度、状态机模型/参考 oracle。
  - 保持 shrink 启用，并确保失败输出种子和最小反例。

- [x] **步骤 6：实现性能采样测试**
  - 创建 `test/domain.performance.test.js`，使用 `node:perf_hooks` 预热后对 `createLevel`、`reduce`、`toViewModel` 各采样 1,000 次。
  - 输出 p50/p95/最大值和环境信息，并以 p95 < 5 ms 为门禁。

- [x] **步骤 7：实现轻量静态质量与 SBOM 生成工具**
  - 创建根级 `scripts/check.mjs`，验证关键应用/测试文件存在、禁止 U1 导入浏览器/渲染依赖，并执行基础结构检查。
  - 创建根级 `scripts/generate-sbom.mjs`，从 lockfile 生成项目依赖清单 JSON；不引入额外 SBOM 包。

- [x] **步骤 8：安装、运行与修复自动化验证**
  - 执行 `npm install` 仅为生成锁文件，然后以 `npm ci` 验证干净安装。
  - 运行示例、属性、性能、检查、`npm audit --audit-level=high` 和 SBOM 命令；修复所有代码/测试/配置失败。
  - 若审计报告高严重度问题，停止并按 NFR 设计要求处理，不静默忽略。

- [x] **步骤 9：生成 U1 代码交付摘要**
  - 创建 `aidlc-docs/construction/u1-game-domain/code/code-generation-summary.md`，记录创建文件、实现故事、公开 API、测试类型、实际版本与验证结果。

- [x] **步骤 10：完成审查**
  - 确认没有代码写入 `aidlc-docs/`，没有不需要的依赖或副本文件，所有 U1 设计职责和 PBT/Security 要求均可追溯。

## 预期生成文件

- `package.json`、`package-lock.json`
- `game-domain.js`
- `test/domain.example.test.js`、`test/domain.property.test.js`、`test/domain.performance.test.js`
- `scripts/check.mjs`、`scripts/generate-sbom.mjs`
- `aidlc-docs/construction/u1-game-domain/code/code-generation-summary.md`

## 计划约束

- 所有生产应用代码均在工作区根目录；`aidlc-docs/` 仅保存 Markdown 文档。
- `fast-check` 和任何包必须使用官方 registry 返回的精确版本，且只在用户批准本计划后安装。
- U1 不引入 UI、R3F、CDN、浏览器存储或音频；这些属于 U2。
- 本计划是 U1 代码生成的唯一执行来源；每个完成步骤必须在同一轮更新为 `[x]`。
