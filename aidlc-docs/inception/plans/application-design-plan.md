# 应用设计计划

## 设计目标

定义一个免构建单页游戏的高层组件边界：U1 保持确定性、可测试且无浏览器副作用的游戏领域逻辑；U2 负责 React 控件、Three.js 场景、拾取、音效与受控浏览器资源生命周期。详细算法和业务规则将在后续每单元功能设计中定义。

## 执行清单

- [x] 阅读已批准的需求、用户故事和执行计划。
- [x] 确认运行时文件组织、UI/场景协调方式和领域接口表达方式。
- [x] 生成 `components.md`，定义组件、职责与高层接口。
- [x] 生成 `component-methods.md`，定义方法签名、输入/输出和用途。
- [x] 生成 `services.md`，定义游戏会话编排、场景运行和音频服务。
- [x] 生成 `component-dependency.md`，定义依赖矩阵、单向数据流与错误边界。
- [x] 生成整合性的 `application-design.md`。
- [x] 验证设计与需求、用户故事、Security Baseline 和 PBT 约束的一致性。

## 需要确认的设计选择

请在每个 `[Answer]:` 后填写一个选项字母；若选择 X，请在字母后补充具体偏好。

## 问题 1：运行时代码组织

免构建静态页面应如何组织生产 JavaScript？

A) 一个 `index.html` 和一个外部 `game.js` ES module；HTML 仅承载样式、导入映射和根节点（推荐）

B) 所有 React、Three.js 与游戏逻辑都内嵌在单一 `index.html`

C) `index.html` 加多个按职责拆分的 ES module（领域逻辑、场景、UI、音频）

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 问题 2：React 与 Three.js 的协调边界

3D 场景和 React HUD 应如何协作？

A) React 仅管理页面 UI 与可访问状态；命令式 Three.js 场景控制器独立管理画布、渲染、拾取和资源释放（推荐）

B) 使用 React Three Fiber 将 Three.js 场景声明式地放入 React 组件树

C) 不使用 React 状态；由 Three.js 和原生 DOM 共同管理所有界面

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: B

## 问题 3：游戏领域接口风格

U1 游戏逻辑应向 U2 暴露何种高层接口？

A) 纯 reducer/命令接口：输入当前状态、动作和时间，输出下一个状态及效果事件（推荐，最适合 PBT）

B) 可变的 `GameSession` 类：UI 通过方法推进并查询其内部状态

C) 混合：关卡生成使用纯函数，游戏会话使用可变类

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 问题 4：3D 资源风格

首版 3D 场景应采用何种资源策略？

A) 全部以 Three.js 基础几何体、材质、光照和程序化动画构成；不加载模型或贴图（推荐）

B) 允许加载一个经完整性校验的外部 3D 小羊模型

C) 允许加载本地项目内的模型和贴图资源

X) 其他（请在下方 `[Answer]:` 后说明）

[Answer]: A

## 审批

填写完上述选择后，请在下方明确批准此设计计划；获批后才会创建应用设计文档。

[Plan Approval]: Approve
