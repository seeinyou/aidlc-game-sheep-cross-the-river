# 应用设计总览

## 已批准的架构决策

| 决策 | 已选方案 | 理由 |
|---|---|---|
| 生产文件形态 | `index.html` + `game.js` | 保持免构建运行，同时把运行逻辑从 HTML 分离。 |
| UI 与 3D 协调 | React + React Three Fiber | HUD、无障碍状态与 Three.js 场景均在一个声明式 React 树中管理。 |
| 游戏规则接口 | 纯 reducer/命令 | 使状态转换、关卡生成与时间推进可复现、易测且适合 `fast-check`。 |
| 3D 资源 | 程序化基础几何体 | 不依赖模型/贴图，减少下载、完整性、许可证和加载失败风险。 |

## 逻辑架构

- **U1 游戏领域逻辑**：`LevelFactory`、`BoardKinematics`、`GameReducer`、`ScorePolicy`。它们仅接受显式输入并返回数据，负责确定性关卡、漂移姿态、生命/得分/阶段和效果事件。
- **U2 浏览器体验**：`GameApp`、`GameCanvas`、`RiverScene`、`PlatformField`、`SheepAvatar`、`GameHudAndOverlay`、`GameSessionService`、`AudioService`、`ErrorBoundary`。它们负责显示、用户输入、会话生命周期、音效和安全降级。
- **边界**：U2 可调用 U1 的公开接口；U1 不得依赖 React、R3F、Three.js、DOM、存储或 Web Audio。

## 编排与生命周期

`GameSessionService` 是副作用的唯一入口：它转换输入与帧时钟为 reducer 动作，发布只读 `GameViewModel`，分发效果，维护可选的会话最高分，并在重玩/卸载时清理帧、事件监听器和音频。R3F 组件仅渲染 ViewModel 与向上报告平台 ID。

React `ErrorBoundary` 负责把渲染失败转换为通俗恢复提示；音频或存储不可用不会阻止核心游戏继续运行。

## 详细设计文档

- [组件与职责](components.md)
- [方法与类型契约](component-methods.md)
- [服务与编排](services.md)
- [依赖、数据流与错误边界](component-dependency.md)

## 合规复核

### Security Baseline

- **合规**：SECURITY-09、10、11、13、15 的设计要求已落入安全错误边界、精确依赖/供应链、无远程输入/服务、CDN 完整性复核和资源清理职责。
- **后续验证**：代码/NFR/构建阶段验证 HTML 安全标头（SECURITY-04）、依赖锁定、漏洞扫描、SBOM、CSP/CDN 完整性和实际错误处理。
- **N/A**：SECURITY-01、02、03、05、06、07、08、12、14；没有后端、数据库、网络中间层、API、身份、IAM 或远程日志设施。

### Property-Based Testing

- **合规**：纯 `GameReducer`、`LevelFactory`、`BoardKinematics` 和 `ScorePolicy` 创建了 PBT-01 的清晰分析对象；`GameSessionService` 也为状态序列模型测试定义了可观察边界。
- **后续验证**：功能设计记录具体性质；NFR 需求锁定 `fast-check`；代码阶段实现 PBT-03、05、06、07、08、10。PBT-02/04 暂为 N/A，除非新增序列化或声明幂等操作。
