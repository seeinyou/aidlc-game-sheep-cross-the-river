# U2 浏览器体验与 3D 场景：代码生成摘要

## 交付结果

U2 已实现为根目录静态单页应用：`index.html` 加载同源 `vendor/runtime.js`，该 bundle 使用已锁定 npm 依赖构建并消费 U1 的 `game-domain.js` 公开 API。没有 CDN、远程模型、贴图、分析服务或运行时网络 API。

### 体验实现

- React + React Three Fiber/Three.js 3D 河面、两岸、漂移木板、小羊、光照、阴影与雾效。
- `GameSessionService` 调度 U1 `START`、`SELECT_PLATFORM`、`TICK`、`RESTART` 和静音动作；U1 仍是唯一游戏领域规则来源。
- 可选木板使用高亮、发光和悬停抬升；HUD 显示关卡、生命、分数和最高分；含约一秒的通关反馈。
- 音频只在用户手势后尝试解锁；失败时静默降级。最高分使用 `localStorage`，不可用时退化为内存保存。
- WebGL 不可用或 React/R3F 渲染异常时显示安全错误覆盖层和重新加载按钮。
- 连续两秒低于 30 FPS 时一次性降低质量；可见性变化时暂停动画帧；服务卸载时释放动画、计时器、事件监听和音频资源。
- 稳定 `data-testid` 与 `aria-live` 状态文本支持浏览器自动化与辅助技术。

## 供应链和本地运行时

| 项目 | 固定版本 / 状态 |
|---|---|
| React | `19.2.0` |
| React DOM | `19.2.0` |
| Three.js | `0.186.0` |
| React Three Fiber | `9.7.0` |
| Playwright | `1.63.0` |
| fast-check | `4.10.0` |
| esbuild（仅构建期） | `0.27.4` |

`esbuild` 仅在 `npm run vendor:runtime` 时将锁文件解析的依赖打包为同源 ESM 文件，解决 R3F npm 发布物在原生浏览器 import map 下所需的 CommonJS/打包器互操作问题。它不是生产服务器，也不在浏览器运行。

当前 `vendor/manifest.json` 记录：

- lockfile version：`3`
- runtime：`runtime.js`
- bundle builder：`esbuild@0.27.4`
- bundle SHA-256：`cc13d87735ab5d490724469b9aa8adbade8b146c72a06a6afd522962831c4959`

`scripts/check.mjs` 验证该 SHA-256、bundle 大小、构建器版本、U1 的纯领域边界、同源运行时约束以及 CSP 不含 `unsafe-inline` 或 `unsafe-eval`。

## 安全

- `static-headers.conf` 定义严格 CSP（`default-src 'self'` 和 `script-src 'self'`）、HSTS、`nosniff`、`X-Frame-Options: DENY`、严格 Referrer Policy。
- `scripts/serve.mjs` 为本地 HTTP 验证提供同源 CSP、文件类型、路径遍历防护、目录拒绝与文件流错误处理。HSTS 仅由 HTTPS 生产托管配置应用，详见 `DEPLOYMENT.md`。
- 没有认证、API、数据存储、云资源、网络中介或外部资源。因此 SECURITY-01、02、03、05–08、11、12、14 为 N/A；SECURITY-04、09、10、13、15 为合规。
- `npm audit --audit-level=high` 通过（退出码 0）。npm 同时报告 `esbuild@0.27.4` 的一项低危 Windows 开发服务器问题；本项目仅将 esbuild 用于本地离线 bundle 生成，不暴露 esbuild 开发服务器。该已知低危问题不影响约定的 high-severity 门禁；升级需单独评估精确版本和 bundle 兼容性。

## 验证证据

| 命令 | 结果 |
|---|---|
| `npm ci --ignore-scripts` | 通过，依据 lockfile 重新安装 49 个包 |
| `npm run vendor:runtime` | 通过，生成 1 个同源 runtime bundle |
| `npm run check` | 通过，含 bundle SHA-256、CSP 与 U1/U2 边界 |
| `npm test` | 14/14 通过（示例、PBT、性能） |
| `npm run test:browser` | 2/2 通过（WebGL 正常启动、强制 WebGL 失败覆盖层） |
| `npm run sbom` | 通过，生成 `artifacts/sbom.json`，49 个包 |
| `npm audit --audit-level=high` | 通过（0 个 high/critical；1 个已记录的 low） |
| `git diff --check` | 通过 |

浏览器额外诊断确认：正常 Chromium 页面有开始按钮和画布、没有错误覆盖层、没有 CSP/module/page error。生成 bundle 经 static/dynamic import specifier 检查不含外部 URL；依赖库的诊断文本或 XML/SVG 命名空间中的 URL 字面量不构成网络请求或运行时资源加载。

## 故事和规则追踪

- US-01 / US-07：开始、3D 河流、小羊、HUD、WebGL 体验与回退。
- US-02–US-06：来自 U1 的可跳平台、跳跃/掉水、三生命、得分/通关与难度规则在 U2 中被可视化和调度。
- PBT-01、03、06、07、08、09、10：已由 U1 的 `fast-check` 确定性布局、边界、状态序列、分数/生命和只读投影属性测试覆盖；PBT-02、04、05 为 N/A（不存在可逆、声称幂等或独立参考算法的 U2 转换）。

## 变更文件

核心实现：`index.html`、`game.js`、`scripts/vendor-runtime.mjs`、`scripts/serve.mjs`、`scripts/check.mjs`、`static-headers.conf`、`test/browser.smoke.test.mjs`、`package.json`、`package-lock.json`、`vendor/runtime.js`、`vendor/manifest.json`、`artifacts/sbom.json`、`DEPLOYMENT.md`。

应用代码均位于仓库根目录；本交付摘要与 AI-DLC 文档仅位于 `aidlc-docs/`。
