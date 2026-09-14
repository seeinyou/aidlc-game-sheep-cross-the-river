# U2 浏览器体验与 3D 场景：代码生成计划

## 单元上下文

- **单元**：U2 浏览器体验与 3D 场景。
- **实现故事**：主要实现 US-01 和 US-07；为 US-02 至 US-06 提供 R3F 平台选择、动画、视觉/音效反馈、失败/通关覆盖层。
- **依赖**：消费已完成的 `game-domain.js` 公开 API；不得修改或复制 U1 领域规则。
- **运行时形态**：根目录 `index.html + game.js`，本地 `vendor/` ESM 运行时，静态 HTTP 服务；文档只写入 `aidlc-docs/construction/u2-browser-scene/code/`。

## 执行步骤

- [x] **步骤 1：确认官方精确依赖版本和兼容性**
  - 查询官方 npm registry 中 React、ReactDOM、Three.js、`@react-three/fiber`、Playwright 的当前精确版本。
  - 验证 React/ReactDOM/R3F/Three 兼容范围；不猜测版本，不使用浮动范围或 latest。

- [x] **步骤 2：更新锁定 npm 配置与脚本**
  - 在根级 `package.json` 添加精确运行时依赖与 Playwright 开发依赖，保留 U1 工具链。
  - 添加脚本：`vendor:runtime`、`serve`、`test:browser`、`test:all`，并更新 `check` 以验证 U1/U2 边界。
  - 生成/更新 `package-lock.json`，不引入未使用包。

- [x] **步骤 3：实现本地 vendor 构建器与完整性产物**
  - 创建 `scripts/vendor-runtime.mjs`：从 npm 安装物复制浏览器 ESM 包及递归静态 import 依赖到 `vendor/`，生成 `vendor/import-map.json`、`vendor/manifest.json`（含 SHA-256）和可嵌入 import map 片段。
  - 失败时停止，不允许远程 CDN fallback；验证所有映射为同源相对 URL。

- [x] **步骤 4：实现安全静态运行时与托管配置**
  - 创建 `index.html`，包含同源 import map、根节点、`game.js` module 入口和无脚本安全提示；不加载外部资源。
  - 创建 `static-headers.conf` 与简洁部署说明，定义 CSP、HSTS、nosniff、X-Frame-Options 与 Referrer-Policy。
  - 创建 `scripts/serve.mjs`，提供静态同源文件、路径遍历保护和开发用 header 支持。

- [x] **步骤 5：实现 U2 React/R3F 游戏体验**
  - 创建 `game.js`，使用 React、ReactDOM、Three 和 R3F 本地 vendor 模块，并导入 U1 `game-domain.js`。
  - 实现 GameSessionService、AudioService、HighScoreStore、RenderQualityController、ErrorBoundary、HUD/覆盖层、R3F 河面/两岸/平台/小羊/特效和响应式画布。
  - 实现稳定 `data-testid`、aria-live、可选木板发光/悬停、约 1 秒通关反馈、静音、WebGL 回退、localStorage 回退、页面可见性及 dispose 清理。

- [x] **步骤 6：实现浏览器冒烟测试**
  - 创建 `test/browser.smoke.test.mjs` 与 Playwright 配置/辅助逻辑，通过项目静态服务测试开始、HUD、静音、重玩、稳定 test ID、可选平台交互和 WebGL 错误覆盖层。
  - 浏览器测试不依赖控制台错误；使用受控浏览器上下文模拟 WebGL 失败。

- [x] **步骤 7：安装运行时和浏览器验证依赖**
  - 按精确版本更新 lockfile，执行 `npm ci`。
  - 安装 Playwright 所需的 Chromium 二进制；该操作是本地可删除的下载，不上传或部署。
  - 运行 vendor 构建器，检查 manifest 和所有 import map 地址为同源。

- [x] **步骤 8：执行并修复完整验证**
  - 执行 `npm run check`、U1 的全部 Node 测试、静态服务/Playwright 冒烟、`npm audit --audit-level=high`、SBOM 生成。
  - 验证 `index.html` 与 vendor 不含 `http://` 或 `https://` 运行时 import；验证 static header 文件满足安全要求。
  - 任一高危 audit 发现、浏览器测试失败、资源泄漏/未处理错误或安全检查失败都必须修复后才能继续。

- [x] **步骤 9：生成 U2 代码交付摘要**
  - 创建 `aidlc-docs/construction/u2-browser-scene/code/code-generation-summary.md`，记录创建/修改文件、精确版本、vendor manifest、故事覆盖和验证证据。

- [x] **步骤 10：完成审查**
  - 确认所有应用代码都在工作区根目录，文档仅在 `aidlc-docs/`，U1 未被破坏，U2 没有远程运行时依赖，并且所有 U2 设计/Security/PBT 责任可追溯。

## 预期文件

- 修改：`package.json`、`package-lock.json`、`scripts/check.mjs`
- 创建：`index.html`、`game.js`、`static-headers.conf`
- 创建：`scripts/vendor-runtime.mjs`、`scripts/serve.mjs`
- 创建：`vendor/`、`test/browser.smoke.test.mjs`、Playwright 配置（如需要）
- 创建：`aidlc-docs/construction/u2-browser-scene/code/code-generation-summary.md`

## 风险与可逆性

- 会安装精确 npm 依赖并下载 Playwright Chromium；删除 `node_modules/`、`vendor/` 和 Playwright 浏览器缓存即可回收本地产物，源文件变更可用版本控制回退。
- 不会部署、上传、调用 AWS、创建云资源、处理个人数据或向第三方传输项目代码。
- 本计划是 U2 代码生成唯一执行来源；每完成一个步骤必须在同一轮更新为 `[x]`。
