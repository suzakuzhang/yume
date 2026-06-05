# yume 实验平台设计 · Experiment & Monitor Platform

> 状态:**设计稿(未实现)** · 2026-06-04
>
> 目的:把 yume 每一次 AI 调用 / 辩论 / 互动作为**受控实验数据**记录下来,并提供
> **可视化的 workflow 浏览**与**统计分析**。一条 workflow(一次读梦)里任意一个记录点
> 都能点进去,看到「当时到底发生了什么」——喂进去的 system/user prompt、模型、回复、
> token、耗时、条件。研究问题见 §0。
>
> 本文把 [2026-06-01 进度](2026-06-01.md) 的引擎现状,与监控/实验计划、存储方案、
> 可视化平台合并成一份 spec。**先看可行性,再决定动不动手。**

---

## 0. 研究问题 (recap)

- **Q1** 整条流程哪一步是**固定输出**、哪一步**有 AI** 参与、AI **怎么**参与?
- **Q2** 辩论里 agent **怎么互相说服**?看到别人之后**是否改观**?
- **Q3** 模型是**「先有判断、再按 role 改写」**,还是**「一听到 role 就直接乖乖这么反应」**?
  (role 改变的是**实质**还是只是**文风**?)
- **Q4** **不同灵 / 不同 role** 对同一个梦的反应**是否不同**?差多少?
- **Q5** 这一切能否**自动化采集**成实验数据集?

Q1–Q2 被动全量埋点即可答;**Q3–Q4 必须有受控对照组**(见 §6),不是被动记录能给的。

---

## 1. 架构总览

```
  引擎纯函数                     单一钥匙孔                    真源(write)            派生索引(read)         可视化 / 分析
 ┌─────────────┐   meta{trace,   ┌──────────────┐  emit Span ┌──────────────┐  ingest ┌──────────────┐   ┌────────────────────┐
 │ debate R1/2/3│──phase,role}──▶ │  callLLM →    │──────────▶│ JSONL          │───────▶│ SQLite          │──▶│ /admin/experiments  │
 │ tarot/painterly│              │  chatCompletion│           │ DATA_DIR/      │        │ experiments.db  │   │  · Run list         │
 │ spirit 群聊   │                │ (instrumented) │           │ experiments/   │        │ (trace/span/    │   │  · Flow explorer ★  │
 │ longitudinal │                └──────────────┘           │  <run>.jsonl   │        │  metrics tables)│   │  · Compare C0/C1/C2 │
 └─────────────┘                                            │ append-only    │        └──────────────┘   │  · Stats dashboards │
 ┌─────────────┐   emit Step(确定性)                          │ 一行一 span     │              │           └────────────────────┘
 │ 起卦/抽牌/    │─────────────────────────────────────────▶ │                │              └──▶ 离线 pandas / notebook
 │ symbol检索/  │                                            └──────────────┘
 │ 静态兜底     │
 └─────────────┘
```

**两条路分开**:LLM 调用全部经 `callLLM → chatCompletion`(`src/lib/llm/callLLM.ts`)——**一处埋点 = 全量捕获**;
确定性步骤(`castByCoin` / 卦查找 / `matchSymbols` / 抽牌 RNG / almanac / 静态兜底)本就是独立纯函数,**代码里固定 vs AI 已经是分开的**,只需显式落记录。

---

## 2. 需要数据库吗?——需要,但是轻的

**结论:JSONL(写) + SQLite(读),不要 Postgres。**

| 方案 | 角色 | 为什么 |
|---|---|---|
| **append-only JSONL** | **真源 / write path** | 永不阻塞请求线程;崩溃不丢;一行一 span;离线 pandas 直接读;天然可复现。`DATA_DIR/experiments/<run_id>.jsonl`。 |
| **SQLite**(`better-sqlite3`) | **派生索引 / read path** | 可视化要 join / 聚合 / 过滤,JSONL 干不了。file-based、无服务、Render 稳定 Node 能编(本机 Node 26 编不了,见 [06-01 §1](2026-06-01.md);项目已留 `db.sqlite.bak`)。~10⁵ 行级别(你 monitor_logs_v2 ~135K 行)SQLite 毫无压力。 |
| ~~Postgres / 云 DB~~ | 不用 | 这个规模、单人/小队实验,重型 DB 是负担。日后真要多人协作再说。 |

**不要复用现有 `usageLogs`**:它在 live 用户 store 里、capped 2000、会截断、会撑爆用户库。实验日志必须**独立 sink**。

SQLite 是**可重建的缓存**:删了从 JSONL 重新 ingest 即可。真源永远是 JSONL。

---

## 3. 数据模型 / Schema

### 3.1 Trace(一次 run = 一次读梦或一个实验单元)
```jsonc
{
  "trace_id": "tr_...",
  "seed_id": "syn_017",            // 合成梦库种子,或真实 dream_id
  "corpus": "synthetic",           // synthetic | real   ← 隐私分区
  "condition": "C2_full_persona",  // C0_neutral | C1_style_only | C2_full_persona | prod
  "model": "deepseek-chat",        // 精确模型串
  "repeat": 2,                     // 同 cell 第几次重复(量温度噪声)
  "started_at": "2026-06-04T...Z",
  "git_sha": "3ab76dd"             // 跑实验时的代码版本
}
```

### 3.2 Span(一行一条;固定步骤与 AI 调用统一进这张表)
```jsonc
{
  "span_id": "sp_...",
  "trace_id": "tr_...",
  "parent_span_id": "sp_...",      // 还原调用图 DAG
  "kind": "generative",            // deterministic | generative
  "feature": "debate",             // debate | tarot | painterly | spirit | longitudinal | cast | draw | retrieve
  "phase": "R1_open",              // R1_open | R2_discuss | R3_synth | open | discuss | final | ...
  "role": "freud",                 // freud|jung|shuxu|daoism|灵 key|moderator|null
  "ts": "...Z",
  "latency_ms": 1840,

  // —— generative 专属 ——
  "model": "deepseek-chat",
  "params": { "temperature": 0.85, "max_tokens": 500 },
  "system_prompt": "你是弗洛伊德的目光……",
  "user_prompt": "意象:……",
  "prompt_hash": "sha256:…",       // 去重 / 比对
  "response_raw": "……",
  "finish_reason": "stop",
  "prompt_tokens": 612,            // ← 现在 chatCompletion 把 API 的 usage 丢了,要接回来
  "completion_tokens": 187,
  "error": null,

  // —— deterministic 专属(择一)——
  "det": {
    "cast":   { "hexagram": "风火家人", "lines": "...", "changing": [5], "seed": 12345 },
    "retrieve": { "matched": ["水","门","坠落"], "tradition": "Freud" },
    "fallback": { "used": true, "reason": "no_api_key" }
  }
}
```

### 3.3 派生 metrics(实验分析,从 span 算出,可重算)
- `divergence(trace, role_a, role_b) → 0..1`  同一梦两 role 核心主张语义距离
- `substance_shift(seed, C0→C2) → 0..1`  实质偏移(回答 Q3)
- `stance_drift(role, A→C) → 0..1`  立场漂移 = 从众/被说服度(回答 Q2)
- `signature_adherence(role) → 0..1`  招牌动作贴合度(弗洛伊德真谈 wish/displacement?术数真先「辨类」?)

---

## 4. 捕获层 (instrumentation) — 改动落点

1. **`CallLLMOptions` 加可选 `meta`**:`{ trace_id, parent_span_id, feature, phase, role }`。各调用点本就知道自己是谁,顺手传入。低侵入。
2. **包 `chatCompletion`**:调用前后计时、接回 API `usage`、把整条 Span 交给 emitter。
3. **emitter**:`appendSpan(span)` → 追加写 `experiments/<trace_id>.jsonl`。失败只 `console.error`,**绝不阻断**用户请求(对比现有 debate 的无声 `catch`,这里要留日志)。
4. **确定性 emitter**:在 `castByCoin` / `drawCard` / `matchSymbols` / 各静态兜底处落 `kind:"deterministic"` 的 Span。
5. **trace 上下文**:prod 路径 = 一次 `/dream/[id]` 读梦一个 trace_id;实验 harness = 批跑器分配 trace_id + 串 parent。

> T1 只做 1–4 + prod trace,就已经能回答 Q1–Q2 并给出「固定 vs AI 全景图」,且**不改任何现有行为**。

---

## 5. 可视化平台 ★(你要的那个)

路由:`/admin/experiments`,沿用现有 `X-Admin-Code` 鉴权(同 `/admin`)。

### 5.1 Run list
按 `corpus / condition / model / 日期 / seed` 过滤的列表,每行一个 trace,显示 token/耗时/步数概览。

### 5.2 Flow explorer ★——「点进每个节点看当时 process」
把一次 run 渲成一张 **workflow DAG**:
- **节点 = span**:确定性步骤 = 灰方块;AI 调用 = 圆点,**按 persona 上色**(沿用 `--lens-*` 色);edge = `parent→child`。视觉与 yume 自家罗盘/星图一致。
- **点任一节点 → 右侧抽屉**展开该 span 的**完整 process**:
  - generative:精确的 **system_prompt + user_prompt + response_raw**、model、params、tokens、latency、所属 condition;
  - deterministic:seed、输入、输出(起到哪卦、命中哪些 symbol、是否走兜底)。
- 这样**一条 flow 里哪一步固定、哪一步哪个 AI 怎么参与,一眼可见且可下钻**。

实现:Next.js 页面 + **手搓轻量 SVG**(项目惯例:罗盘、`AlmanacChart` 都是手写 SVG,不引重依赖)先做**纵向时间线-DAG**;若以后要拖拽/缩放再考虑引入 React Flow。

### 5.3 Compare view
- **C0 / C1 / C2 并排**(同一个梦三条件)→ diff 高亮核心主张差异,直观回答 Q3;
- **同一梦 × 4 目光并排** → 回答 Q4。

### 5.4 Stats dashboards
- 跨人设**分歧热力图**;`substance_shift` 分布(C0→C2);`stance_drift` A→C;token/latency/成本;**多模型对比**(同一梦 deepseek vs 别的)。
- axis-anchored 打分沿用你的 **VAT/RMDT 协议**。

---

## 6. 受控实验 harness(回答 Q3–Q4 的核心)

**三条件**(每梦 × 每模型):
- **C0 中立**:无人设,中立解梦 → 「底层判断」基线。
- **C1 仅文风**:C0 中立读 → 第二步「用弗洛伊德语气重写」(实质锁死,只换皮)。
- **C2 完整人设**:「你是弗洛伊德」一步到位(= 现行为)。

判读:C2 的**实质**(key_symbols/headline)更近 C0 → role 是**文风贴皮**;偏向人设招牌动作 → role **改了认知**。
另加**两段自省探针**:先要「无 role 读法 + 置信度」,再戴 role;量 role 引入的位移——**就是 perception–report-gap 框架搬到人设上**。

**说服研究**:引擎 R2 是**单个主持叙述**,不是真多 agent 互劝;研究「互相说服 / 看到别人后改观」用**唤灵群聊**(`spirit/route.ts`:open→discuss→final,每灵每轮各自调用)做底座更合适,或把 R2 重构成每 agent 二轮发言。

**批跑器**:`种子 × 条件 × 人设 × 模型 × 重复n` 直接驱动引擎函数(不走 UI),固定 seed 可复现,重复 n 次量温度噪声。形状与你现有 monitor package 同构。

**种子梦库**:合成为主,沿轴设计(六梦类型 × 情绪效价 × 稀疏/丰富 × 歧义符号),真实梦 opt-in。

---

## 7. 分期(= 可行性档位)

| 档 | 成本 | 内容 | 回答 |
|---|---|---|---|
| **T1** | ~半天 | 埋点 + token 接回 + JSONL sink + provenance 标签(prod trace) | Q1–Q2 + 固定/AI 图 |
| **T1.5** | ~半天 | JSONL→SQLite ingest + **Flow explorer 最小版** | 「点进节点看 process」可用 |
| **T2** | 1–2 天 | 种子库 + 批跑器 + C0/C1/C2 + 跨人设 | Q3–Q4 |
| **T3** | 分析 | metrics + judge + Stats dashboards | 成实验结论 |

T1+T1.5 即给你「**可视化的固定 vs AI 全景 + 可下钻**」,零行为风险。

---

## 8. 隐私 / 伦理
真实用户的梦敏感。实验**默认只跑合成梦库**;真实梦须显式 opt-in + 去标识;每条 Span 标 `corpus`,硬分区。

## 9. 风险 / 注意
- **模型依赖**:「role 改实质 vs 改文风」**因模型而异**(参你 gpt-5.5 ladder-reversal)——至少 ≥2 模型,精确记 model 串;实验每跑 pin 死模型。
- 温度>0 非确定 → 重复 n 次,或实质对比组用 temp=0。
- R2 非真多 agent 说服(见 §6)。
- 现有 debate 的无声 `catch` 会吞掉降级原因——埋点处必须留 error 日志。

## 10. 待定(需你拍板)
1. Flow 渲染:先手搓 SVG 纵向 DAG,还是直接引 React Flow?
2. SQLite 走 `better-sqlite3`(Render 稳定 Node)确认可编。
3. 合成梦库规模 + 每 cell 重复 n。
4. 纳入哪些模型(deepseek + ?)。
5. 先动 **T1 埋点**,还是先一起把 **T2 合成梦库 + 三条件**设计敲细?
