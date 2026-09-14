# U2 NFR 设计模式

## 自适应渲染质量模式

1. `RenderQualityController` 在 R3F 帧边界统计帧间隔，维护 2 秒滚动窗口。
2. 当窗口内有效 FPS 连续低于 30 时，若尚未降级，执行一次降级：降低 renderer 像素比上限并关闭/减少 splash 与庆祝粒子。
3. 降级标记在当前会话保持；不会自动上调，直到重玩或页面刷新创建新质量状态，避免视觉质量在阈值附近反复跳变。
4. 不移除核心几何体、HUD、点击命中或领域 tick；性能控制器不能改写 U1 state。
5. renderer 初始像素比为 `min(devicePixelRatio, configuredCap)`；resize 后重新应用当前质量 cap。

## 集中副作用与生命周期模式

- `GameSessionService` 是 RAF、visibilitychange、localStorage 和效果处理的唯一拥有者。
- 使用单一 RAF 标识符；调度下一帧前确认当前 ID 已失效或不存在，避免并行帧链。
- 页面不可见、game-over、重玩、ErrorBoundary fallback 和 React unmount 均通过同一个 `dispose` 路径取消 RAF、清除 timeout、移除 listener、取消订阅和关闭音频。
- 所有浏览器 API 访问用局部 try/catch 保护；错误映射为内存回退或安全 UI key，不能传播原始异常内容。

## 本地 vendor 与 import map 模式

1. npm 使用官方 registry 中的精确版本安装 React、ReactDOM、Three、R3F 及其直接浏览器 ESM 依赖，全部由 lockfile 解析。
2. `vendor-runtime` 脚本从 `node_modules` 拷贝浏览器 ESM 入口和静态 import 所需文件到 `vendor/<package>/`，保留相对路径结构。
3. 脚本写出 `vendor/import-map.json` 和 `vendor/manifest.json`：manifest 含包名、精确版本、源 lockfile 路径、生成时间和每个文件的 SHA-256。
4. `index.html` 嵌入由 import-map.json 派生的同源 import map；没有外部 URL。
5. 生成后静态服务器和 Playwright 验证模块请求均来自同源 `vendor/`；升级包时必须重新生成、审计、SBOM 与冒烟测试。

## 静态响应头与 CSP 模式

- `static-headers.conf` 存储通用 header 规范，部署说明解释将其映射到静态托管平台。
- CSP 限制为同源资源：不含 CDN、`unsafe-eval`、外部 connect、object 或 frame 来源。
- 音频使用 Web Audio，不要求 `media-src` 外部域；仅允许 `data:` 图像用于内联粒子/图标时的明确场景。
- 引入新的外部来源前必须更新需求、CSP、完整性评估和安全审查。

## 错误与弹性模式

- WebGL 预检失败或 ErrorBoundary 捕获渲染异常时进入 ErrorOverlay；显示白名单说明与 reload 按钮。
- AudioService 在用户手势后单次尝试解锁；失败后设 `audioSilent`，不阻塞会话也不重试风暴。
- HighScoreStore 将 parsed 数字限制为有限非负整数；异常/不可用存储进入内存回退。
- ErrorOverlay、AudioService、HighScoreStore 和 RenderQualityController 不改变游戏领域生命、分数、关卡或跳跃结果。

## 可访问性与自动化模式

- HTML 覆盖层保留语义按钮、焦点轮廓、足够点击尺寸和 `aria-live="polite"` 状态播报。
- 金色高亮必须有伴随文本和状态反馈；不是选择目标的唯一线索。
- 所有互动元素使用稳定 test ID；Canvas 有可定位容器，R3F 平台有固定对象名称。
- Playwright 通过静态 HTTP 服务验证正常流程、静音、重玩和 WebGL 回退；使用浏览器上下文配置模拟无 WebGL，而非读取不稳定控制台错误。

## 合规映射

- **SECURITY-04**：同源 import map + 静态安全头/CSP。
- **SECURITY-09/15**：安全 ErrorOverlay、受控 fallback、集中资源清理。
- **SECURITY-10/13**：精确 registry 依赖、lockfile、本地 vendor manifest 哈希、审计、SBOM。
- **SECURITY-11**：白名单 UI actions，不允许 UI 直接篡改领域状态。
- **PBT**：U2 不生成新的核心领域算法；U1 PBT 保持规则门禁，U2 以可重复浏览器示例测试验证副作用和界面。
