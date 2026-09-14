# 小羊过河 🐑

一个基于 **React、React Three Fiber 和 Three.js** 的单页 3D 小游戏。点击金色漂移木板，让小羊逐段过河；掉水会损失生命，三条生命耗尽则游戏结束。

## 环境要求

- Node.js **24.3.0 或更高版本**
- npm（验证环境使用 npm 11.6.0）
- 支持 WebGL 的现代浏览器

不需要环境变量、数据库、云账号或 API 密钥。

## 安装

在项目根目录执行：

```bash
npm ci --ignore-scripts
```

该命令严格按照 `package-lock.json` 安装锁定版本的依赖。

> 若要运行浏览器自动化测试，还需要首次安装 Playwright Chromium：
>
> ```bash
> npx playwright install chromium
> ```

## 构建本地运行时

游戏运行时完全来自本地同源文件，不使用 CDN。安装依赖后生成浏览器 bundle：

```bash
npm run vendor:runtime
npm run check
```

成功后会生成：

- `vendor/runtime.js`：浏览器加载的本地 3D 游戏运行时。
- `vendor/manifest.json`：runtime bundle 的大小和 SHA-256 完整性记录。

`npm run check` 会验证 bundle 完整性、严格 CSP、必需安全头以及 U1 游戏逻辑未引入浏览器/渲染依赖。

## 本地运行

```bash
npm run serve
```

然后在浏览器打开：<http://127.0.0.1:4173/>

点击“开始游戏”，再点击场景中金色发光的木板前进。按 `Ctrl+C` 停止本地服务器。

## 测试与质量检查

```bash
# U1 游戏逻辑：示例测试、属性测试和性能测试
npm test

# 浏览器冒烟测试：正常 WebGL 与 WebGL 不可用时的安全覆盖层
npm run test:browser

# 执行全部测试
npm run test:all

# 静态完整性与安全检查
npm run check

# 生成软件物料清单（SBOM）
npm run sbom

# 检查 high / critical 依赖漏洞
npm audit --audit-level=high
```

已验证的基线为：14 个领域测试和 2 个 Playwright 浏览器测试全部通过；领域操作 p95 小于 5 ms。

## 生产静态托管

部署时将仓库根目录作为静态站点内容，并通过 HTTPS 提供服务。必须为 HTML 响应应用 `static-headers.conf` 中的安全头，包括严格同源 CSP、HSTS、`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY` 和 `Referrer-Policy`。

本地 `npm run serve` 仅用于 HTTP 开发验证，因此刻意不发送 HSTS。详细部署要求见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 常见问题

- **浏览器显示 WebGL 错误覆盖层：** 请使用支持 WebGL 的现代浏览器，并检查浏览器或设备的 GPU/WebGL 设置。
- **bundle 或完整性检查失败：** 不要手动编辑 `vendor/runtime.js`；执行 `npm run vendor:runtime` 重新生成 bundle 和 manifest。
- **依赖或 bundle 解析失败：** 删除 `node_modules/` 和 `vendor/` 后，重新执行：

  ```bash
  npm ci --ignore-scripts
  npm run vendor:runtime
  ```
