# U2 技术栈决策

## 生产运行时

| 领域 | 决策 | 版本与来源要求 | 理由 |
|---|---|---|---|
| UI | React | 官方 npm registry 的精确版本；复制为本地 vendor ESM | 声明式 HUD、状态和错误边界。 |
| DOM 渲染 | ReactDOM | 与 React 相同精确版本；本地 vendor ESM | 挂载 React 根。 |
| 3D 引擎 | Three.js | 官方 npm registry 的精确版本；本地 vendor ESM | WebGL 场景、几何体、材质、灯光。 |
| React/Three 桥接 | `@react-three/fiber` | 官方 npm registry 的精确版本；本地 vendor ESM | 批准的声明式 R3F 场景树。 |
| 运行时分发 | 本地 `vendor/` ES modules + import map | 由 npm lockfile 中安装物生成，不从 CDN 加载 | 同源 CSP、离线/稳定运行和供应链可追溯。 |
| 音效 | Web Audio API | 浏览器内置 | 无外部媒体文件、受用户手势限制。 |
| 高分 | `localStorage` | 浏览器内置；固定 key，只存数字 | 非敏感、尽力持久化。 |

## 开发与验证工具

| 工具 | 决策 | 用途 |
|---|---|---|
| `node:test` + `fast-check` | 沿用 U1 已锁定工具链 | U1 规则/性质/性能验证。 |
| Playwright | npm 开发依赖，精确版本，在代码生成前从官方 registry 确认 | 静态服务浏览器冒烟和 WebGL 降级验证。 |
| Node 静态服务器脚本 | 项目内脚本，不引入额外服务端框架 | 在本地/CI 提供静态页面。 |
| npm | lockfile、`npm ci`、audit、SBOM | 可复现安装与供应链检查。 |

## vendor 生成原则

1. 运行时库必须先作为精确版本 npm 依赖安装并进入 `package-lock.json`。
2. `scripts/vendor-runtime.mjs` 在代码生成阶段从 `node_modules` 复制必要 ESM 文件至 `vendor/`，并生成或维护 import map；不得从网络下载。
3. R3F/Three 的 ESM 依赖路径必须在本地 import map 中解析，运行时请求不得离开同源目录。
4. vendor 文件是可再生构建产物：升级依赖后必须重新生成、审计、更新 SBOM 并运行 Playwright。

## 静态托管安全配置

项目将生成可部署的 `static-headers.conf`（通用 header 描述）和部署说明；具体托管平台适配不属于首版。配置必须满足 NFR 中的 CSP、HSTS、nosniff、X-Frame-Options 和 Referrer-Policy 值。

## 待代码生成验证

- React、ReactDOM、Three.js、R3F 和 Playwright 的精确版本在安装前通过官方 npm registry 确认，不能猜测。
- 必须验证 vendor 产物能在无外网依赖的静态 HTTP 服务中成功解析。
- Playwright 浏览器二进制安装需要网络/磁盘操作；仅在获批的 U2 代码生成阶段执行。
