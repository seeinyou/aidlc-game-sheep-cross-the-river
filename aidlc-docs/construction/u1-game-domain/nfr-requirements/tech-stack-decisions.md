# U1 技术栈决策

## 已选技术

| 领域 | 决策 | 版本与约束 | 理由 |
|---|---|---|---|
| 运行时/测试宿主 | Node.js LTS | 选择当前支持的 LTS 主版本；在 package metadata 中声明 `engines.node` 下限 | 原生 ESM 与 `node:test`，无需编译器。 |
| 示例测试 | `node:test` | Node 内置模块；不新增测试运行器依赖 | 最小供应链、与 ESM 兼容。 |
| 属性测试 | `fast-check` | npm 开发依赖，精确版本；必须支持自定义 arbitraries、收缩、种子重现 | 满足 PBT-09 和 U1 领域模型测试。 |
| 包管理 | npm | 提交 `package-lock.json`；使用 `npm ci` 进行干净安装 | 可复现依赖解析。 |
| 代码格式 | Node 内置检查或精确版本格式化工具 | 在代码生成阶段选择并固定；不得使用浮动版本 | 可重复的格式质量门。 |
| 性能抽样 | `node:perf_hooks` | Node 内置 | 无外部基准依赖即可测量 U1 函数调用。 |

## 生产与开发依赖边界

- **生产运行**：`index.html` 通过 import map 使用 React、ReactDOM、Three.js、R3F 的精确 CDN 模块版本；这些将在 U2 NFR 需求中确定来源、CSP 和完整性复核。
- **U1 开发依赖**：仅 `fast-check` 作为新增第三方库；`node:test` 和 `node:perf_hooks` 均为 Node 内置。
- 依赖不允许版本范围、`latest`、未验证 registry、全局工具或未使用包。

## 本地与 CI 可复制命令

在项目实现后，以下命令必须可用并写入 build/test 说明：

```sh
npm ci
npm test
npm run test:example
npm run test:property
npm run check
npm audit --audit-level=high
npm run sbom
```

首版不创建远程 CI 工作流文件；构建与测试文档必须给出按上述顺序执行的可复制 CI 命令。`npm audit` 的高严重度结果是阻塞发现，必须修复或由用户明确接受风险。

## 依赖治理

1. 每次添加/升级依赖时，记录名称、精确版本、用途、来源和替代方案。
2. 提交 `package.json` 与 `package-lock.json`；干净安装使用 `npm ci`，不使用 `npm install` 修改锁文件。
3. 在构建与测试阶段生成并检查 SBOM；在实现阶段优先使用 npm 内置或现有依赖，避免引入无关包。
4. `fast-check` 测试失败必须输出可复现种子；框架收缩不得关闭。

## 决策待代码生成验证

- `fast-check` 的精确版本将在写入 `package.json` 前从官方 npm 元数据/锁定安装结果中确认，不能猜测。
- Node LTS 的实际最低版本将在生成 package metadata 前从本机/项目要求验证，不能假定。
- 格式化工具若非 Node 内置，必须经显式精确版本安装并纳入锁文件；若不添加工具，则 `check` 仅执行测试/静态结构检查并在构建说明中明确。
