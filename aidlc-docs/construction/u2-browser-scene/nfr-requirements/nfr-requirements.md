# U2 NFR 需求

## 渲染性能与资源使用

1. 在常见笔记本和现代移动设备上，目标为 60 FPS；这是目标而非逐帧硬失败 SLA。
2. 连续 2 秒低于 30 FPS 时，场景必须降低像素比上限和/或粒子数量；核心河流、木板、小羊、HUD 和输入仍可用。
3. RAF 仅在页面可见且会话处于 playing/jumping 等活动阶段运行；隐藏、重玩、卸载与失败时取消 RAF。
4. 场景必须使用程序化基础几何体/材质；禁止加载模型、纹理、远程图像或背景音频，避免不可控的下载和显存使用。
5. 画布在 resize 后更新相机投影和渲染尺寸；像素比必须有上限，避免高 DPR 设备过度渲染。

## 可靠性与可用性

1. GameSessionService 是 RAF、visibilitychange、localStorage 和音效 effects 的唯一浏览器副作用拥有者；重玩/卸载时取消帧、监听器、计时器和音频节点。
2. Web Audio 解锁仅由用户手势启动；不支持/被拒绝时静默降级，不影响游戏领域逻辑或 UI。
3. localStorage 仅尽力保存固定 key 下的非负数最高分；读取、解析或写入失败时退回内存值并继续游戏。
4. WebGL 预检或 R3F 错误必须显示不含内部详情的安全错误覆盖层，提供重新加载操作；不提供 2D 替代游戏。
5. 不创建后端、账户、远程 API、服务端会话或远程遥测；服务 SLA、灾备、跨实例扩缩、远程告警/日志为 N/A。

## 安全与供应链

1. 生产运行时库采用**本地 vendor 文件**：React、ReactDOM、Three.js、React Three Fiber 均从官方 npm registry 以精确版本获取，受 `package-lock.json` 固定，并复制到项目内静态 `vendor/` 目录。
2. `index.html` 仅加载同源本地模块；部署 CSP 最少为 `default-src 'self'`，不需要将第三方 CDN 加入 `script-src`。
3. 静态托管配置必须在部署时设置：
   - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
4. 生产代码不得使用 `unsafe-eval`、远程脚本、默认凭证、用户文本输入、秘密、令牌或个人数据。
5. 所有依赖必须精确版本、保留 lockfile、经 `npm audit --audit-level=high` 验证，并写入 SBOM；高危发现为阻塞项，除非用户明确风险接受并记录临时缓解。

## 可访问性和可维护性

1. HUD/覆盖层使用语义元素、可见焦点、触摸大小按钮和 `aria-live="polite"` 状态区域。
2. 可跳木板同时用金色视觉、悬停行为和文本说明提示；颜色不能作为唯一信号。
3. 交互元素必须保持稳定 `data-testid`；Canvas 容器、错误覆盖层、开始/重玩/静音/重载按钮均可定位。
4. U2 代码只能消费 U1 导出的纯接口；禁止复制关卡/计分/生命/落点规则。
5. 运行时 vendor 刷新必须通过 npm lockfile、审计、SBOM 和浏览器冒烟验证；不得人工从未验证来源替换文件。

## 浏览器测试

1. 静态 HTTP 服务 + Playwright 自动冒烟为最低浏览器验证。
2. 冒烟测试覆盖启动、HUD 更新、可选平台点击、掉水/失败显示、重玩、静音、错误覆盖层和关键 `data-testid`。
3. 测试可用 Playwright 的路由/初始化脚本模拟 WebGL 失败；不依赖控制台错误文本。
4. U1 的 Node 示例/PBT/性能测试仍必须在浏览器测试前通过。

## 扩展合规

### Security Baseline

- **适用**：SECURITY-04（同源 CSP 和全部响应头）、SECURITY-09（安全错误/最小运行时）、SECURITY-10（精确版本/lockfile/审计/SBOM）、SECURITY-11（输入白名单/业务滥用边界）、SECURITY-13（npm 安装物完整性/本地 vendor）、SECURITY-15（错误边界/资源清理）。
- **N/A**：SECURITY-01、02、03、05、06、07、08、12、14；无数据持久化、网络中间层、服务端应用、API、IAM、网络、认证或远程日志。

### Property-Based Testing

- U2 不新增核心领域转换；仍使用 U1 的 PBT 作为规则正确性保障。
- U2 会话清理、静音和 UI 动作映射通过示例/浏览器冒烟测试验证；如果提取纯转换函数，须按 PBT-03/07 添加相应性质测试。
