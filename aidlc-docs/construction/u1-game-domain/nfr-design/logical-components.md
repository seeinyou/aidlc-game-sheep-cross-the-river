# U1 NFR 逻辑组件

这些组件是实现与验证职责，不是网络基础设施或独立部署服务。

| 逻辑组件 | 责任 | 输入/输出 | 关联模式 |
|---|---|---|---|
| Domain Boundary Guard | 验证/夹紧动作、数值和状态不变量；对无效输入生成安全拒绝。 | `GameState + GameAction → safe action/Transition` | 总函数、安全失败。 |
| Deterministic Inputs | 统一种子派生和单调 tick 规则。 | `baseSeed, levelNumber, elapsedMs` | 纯核心、确定性。 |
| State Transition Core | 通过 reducer 生成不可变下一状态和白名单效果。 | `GameState + Action → Transition` | 状态机、总函数。 |
| Domain Generator Library | 为关卡、平台、动作序列、种子和时间生成约束测试数据。 | fast-check arbitraries | PBT-07、状态模型。 |
| Reference Model/Oracle | 对关键规则提供简单、独立的可达性/计分/状态检查。 | 领域输入 → 预期可观察结果 | PBT-05/06。 |
| Example Test Suite | 固定玩家路径与 PBT 回归反例。 | node:test cases | PBT-10。 |
| Property Test Suite | 大范围验证性质并记录种子/收缩反例。 | fast-check properties | PBT-03/05/06/08。 |
| Performance Sampler | 预热、采样、计算 p50/p95/最大值并执行 5 ms p95 门禁。 | 受测纯函数 → 统计/通过失败 | 性能门禁。 |
| Dependency Quality Gate | 通过 lockfile 安装、审计和 SBOM 检查供应链。 | npm metadata/lockfile → 通过/阻塞发现 | SECURITY-10/13。 |

## 运行顺序

1. `npm ci` 根据 lockfile 安装依赖。
2. 运行静态/格式检查。
3. 运行 Example Test Suite。
4. 运行 Property Test Suite；失败输出种子和最小反例。
5. 运行 Performance Sampler；p95 >= 5 ms 则失败并输出统计。
6. 运行 Dependency Quality Gate：审计高危发现阻塞，随后生成/验证 SBOM。
7. 所有 U1 门禁通过后，U1 公开契约可供 U2 使用。

## 生命周期与边界

- 这些逻辑组件仅在开发、测试或构建验证中运行；生产 U1 运行时仅包含纯领域核心。
- 性能采样和 PBT 不读取生产浏览器状态、不访问网络，也不修改源领域对象。
- 依赖质量 gate 的输出为报告/SBOM 产物；不允许应用代码删除、篡改或忽略审计结果。

## 故障处理

- 示例/PBT/性能失败均以非零退出状态结束，并保留可读的失败上下文。
- PBT 失败：报告种子、收缩反例、属性名和相关业务规则。
- 性能失败：报告函数名、p50/p95/最大值、迭代次数和环境信息。
- 高危审计失败：报告包、受影响版本、建议修复；只有记录且经用户明确接受的临时例外才可继续。
