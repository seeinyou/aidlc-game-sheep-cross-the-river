# U2 代码生成计划修订：本地运行时打包

## 发现的兼容性阻塞

已按获批计划从官方 npm registry 安装并锁定 React 19.2.0、ReactDOM 19.2.0、Three 0.186.0、R3F 9.7.0 与 Playwright 1.63.0，并生成了同源 `vendor/` 目录。实际 Chromium 验证发现：R3F 的 npm 浏览器入口依赖 CommonJS/打包器互操作（包括 Scheduler 优先级 API），逐个 import map shim 无法稳定、完整地提供其浏览器 ESM 导出。

这不是 U1 游戏逻辑、CSP 或远程网络错误；继续增加手工 shim 会提高供应链和维护风险，且不符合可重复构建要求。

## 最小修订

在已批准 U2 计划的步骤 2、3、7 与 8 中增加：

1. 从官方 npm registry 添加精确开发依赖 `esbuild@0.27.4`（已确认该精确版本存在；不使用范围或 latest）。
2. 创建 `scripts/build-runtime.mjs`，使用已锁定的 npm 安装物将 React、ReactDOM、Three、R3F 及其依赖打包为同源 `vendor/runtime.js`；不从网络下载运行时资源。
3. 将 `index.html` 的 module 入口改为同源本地 runtime bundle；运行时 import 不再依赖手工维护的 package import map/shim 链。
4. 更新 `vendor/manifest.json`，包含 lockfile 关联、`runtime.js` SHA-256 与精确包版本。
5. 保留现有 `npm ci`、audit、SBOM、CSP、静态服务和 Playwright 门禁；重新验证没有任何外部运行时请求。

## 安全与可逆性

- **安全影响**：降低风险。所有运行时代码仍来自锁定的官方 npm 包，静态页面仍只加载同源 `vendor/runtime.js`，CSP 保持不含 CDN 和 `unsafe-eval`。
- **可逆性**：删除 `node_modules/`、`vendor/` 并用版本控制回退 package/config/source 文件即可恢复。
- **范围**：不部署、不上传、不调用 AWS、不处理个人数据。

## 审批

是否批准此最小 U2 代码生成计划修订，并允许安装精确版本 `esbuild@0.27.4` 和生成本地 runtime bundle？

A) 批准修订：使用精确锁定的 esbuild 构建同源本地 `vendor/runtime.js`（推荐）

B) 不批准：停止 U2 代码生成，保留当前已完成 U1 与设计产物

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A
