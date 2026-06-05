# yume `/lab` — 隐藏实验模式 · 理论碰撞的可解剖现场

> 状态:**T1 埋点底座已实现(2026-06-05)**;`/lab` UI 未建 · 这是 `experiment-platform.md` 的延伸与收口
>
> 一句话:正常网址 = 沉浸的仪式(看不到任何实验入口);网址后加 `/lab` = 同一次读梦被**解剖**成可下钻的流程图,看 yume 里各种理论(弗洛伊德/荣格/道家/卦灵/牌灵)**怎么碰撞**。

---

## 0. 主线 = A,不是 B(2026-06-05 锁定)

`experiment-platform.md` 用工程口径问「role 改实质还是文风」(Q3)。lab 把它**重构成人文口径**:

- **A(主线)= 理论碰撞作为可探索的现象。** 展示 lenses **怎么立论、看到彼此、改不改口**。对齐 PhD 主线(human–AI–symbol 三元体作为投射工具)。既能 **replay**(策展画廊),也能 **live**(当场喂一个梦,看 open→discuss→final)。**live 解剖是 yume 相对活论文(只能 replay)的独有优势。**
- **B(受控实验:C0/C1/C2、实质 vs 文风、统计 dashboard)= 降格为附录/远期补证。** 本项目语料是个位数(见 §2),n 太小,统计无意义,B 基本搁置。`experiment-platform.md` §6 的三条件 harness 留作日后参考,不在当前范围。

## 1. 语料与隐私(2026-06-05 锁定)

- **语料 = 我自己的梦 + 2–3 个明确同意的好友的梦**,用于打磨 demo。**无需合成梦库。**
- 这是 research prototype,前几天刚做出来,**没有陌生用户**,只有 2–3 位知情好友在测。所以**当前不做同意分区机制**:所有现存梦都可进 lab(所有现存用户已同意)。
- **留一颗 future-proof 螺丝**:schema 里预留 `labConsent?: boolean`(默认 lab 全开);哪天对陌生人开放,只需把默认翻成「需显式同意」+ 在 admin 给某条梦关掉。现在零额外工作量。

## 2. 已实现:T1 埋点底座(2026-06-05)

**目标:在背后给每次动作装行车记录仪,用户无感、绝不阻断请求。** 已落地:

### 数据模型 `src/lib/experiments/types.ts`
- `Span` = 一个动作的快照(`kind: "generative" | "deterministic"`)。
- generative 字段:`model, params{temperature,maxTokens,format}, systemPrompt, userPrompt, promptHash(sha256:16), responseRaw, finishReason, usage{prompt/completion/total Tokens}, latencyMs, error`。
- deterministic 字段:`det`(任意结构 — 起到哪卦、抽哪张牌、命中哪些 symbol、是否走兜底)。
- `SpanMeta` = 调用点自报家门:`{ traceId, parentSpanId?, feature, phase?, role?, corpus? }`。

### 真源 sink `src/lib/experiments/sink.ts`
- **append-only JSONL,一文件一 trace**:`${DATA_DIR}/experiments/<traceId>.jsonl`。`/data` 已 gitignore。
- **写永不抛**:`appendSpan` 失败只 `console.error`。
- `recordGenerative(meta, data)` / `recordDeterministic(meta, det)`;读路径 `listTraceIds()` / `readTrace(traceId)`(供 /lab 直接消费,先不上 SQLite)。
- 冒烟已验:det + gen span 正确写入并读回,字段齐全。

### trace 锚定方式
**prod `traceId = dream.id`** —— 一梦一文件 = lab 里一个可探索 artifact;re-read 追加(span 带 `ts`,可见历史)。比让 client 串 trace_id 简单,且正好契合画廊模型。例外:longitudinal 跨梦,用 `lon_<userId>`。

### 捕获点(全量,覆盖整条 众声 碰撞 + 凝象)
| feature | phase | role | kind | 落点 |
|---|---|---|---|---|
| `painterly` | 凝象 | leadGaze | gen | `image/route` → `imageryToPainterly` |
| `cast` | — | gua | det | `cast/route`(铜钱 + 卦) |
| `draw` | — | pai | det | `tarot/route`(抽牌) |
| `tarot` | reading | pai | gen | `buildTarotReading` |
| `retrieve` | — | null | det | `runDebate`(matchSymbols 命中) |
| `debate` | R1_open | 每 lens | gen | `runDebate` R1 立论(并行) |
| `debate` | R2_discuss | moderator | gen | `runDebate` R2 求同存异 |
| `debate` | R3_synth | moderator | gen | `runDebate` R3 synthesis |
| `debate` | static | null | det | 无 key / 生成失败兜底(记 reason) |
| `spirit` | open/discuss/final | 每灵 / _conclusion | gen | `spirit/route` 唤灵群聊 |
| `longitudinal` | — | null | gen | `longitudinal/route` |

**核心 seam:** `callLLM(system, user, { meta })` —— 传 meta 即录一条 generative span,捕获实际应答的模型(primary/fallback)、usage、latency、error。**附带修了一个老问题**:之前 debate/tarot/spirit 的无声 `catch` 会吞掉降级原因,现在 fallback 与错误都进 span。无 meta 的调用静默不录,零侵入。

## 3. 未建:`/lab` UI(下一步,平移活论文)

路由 `/...../lab`,沿用 `X-Admin-Code` 鉴权(同 `/admin`)。从 `emnlp/hidden_risk_demo/livingpaper/` 平移:
- **`ProcessDrawer.tsx`** —— 点节点 → 右侧抽屉看「当时到底发生了什么」(完整 system/user prompt、responseRaw、model、tokens、latency)。
- **`workflow/page.tsx`** flow-explorer —— 一次 trace 渲成纵向时间线-DAG;det = 灰方块,gen = 按 persona `--lens-*` 上色的圆点。手搓 SVG(项目惯例),不引 React Flow。
- **gallery** —— `listTraceIds()` 列表,每条梦一个可点入的 artifact。
- 先做**单梦解剖(replay)**;再加 **live**(在 lab 当场喂梦看碰撞)。

## 4. 远期(B,附录级,非当前范围)
SQLite 读索引(可从 JSONL 重建)、C0/C1/C2 三条件 harness、divergence / stance_drift / signature_adherence metrics、跨人设/跨模型对比 dashboard。详见 `experiment-platform.md` §3.3 / §5 / §6。
