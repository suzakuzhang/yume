# yume Daily Reading Pipeline

## The one daily ritual

```
[1] INTAKE imagery        →  user submits ONE dream IMAGERY element (+ optional free text, affect, day-residue, 身份/时令)
[2] REVERSE-GUIDED IMAGE  →  prompt-build a generated image in Chinese-painting-appreciation (画作赏析) brushstrokes
[3] 4-LENS DEBATE         →  Phase A establish 4 views (isolated) → Phase B oracle injection → Phase C 求同存异 → Phase D synthesis
        ├─ 起卦              (within Phase B: dream image → 八卦类象 → cast 本卦/变卦)
        └─ 抽塔罗            (within Phase B: draw tarot)
[4] SYNTHESIS & GUIDANCE  →  converged themes, live tensions, referee caveats, science flags, image note,
                            ONE 建议 (next step), ONE 自我探寻 (reflection prompt), bounded confidence
[5] LOG → TIMELINE        →  store View Cards + oracle draws + Hall–Van de Castle content codes + synthesis for 纵向 analysis
```

Philosophy (referee) and dream-science (grounding) run *underneath* steps 3–4, never as a fifth verdict. The four PRIMARY debaters are Freud, Jung, 周公解梦, and Divination (起卦+Tarot).

---

## Step 1 — Intake imagery
Capture: the single salient image, the dreamer's own words, affect/intensity, any day-residue ("what happened yesterday?"), and — for the Chinese lens — the dreamer's **身份/处境** and the **时令** (season). The day-residue field directly feeds `agent.freud`; affect feeds the warmer lenses so the philosophy referee's rigor does not freeze the reading; 身份/时令 feed `agent.zhougong`'s 因人而异 / 时梦 logic.

## Step 2 — Reverse-guided image (画作赏析 brushstrokes)
The generated image is, per the Philosophy lens, an **analogon** (Sartre): an externalized act of imagination, not a literal screenshot of the dream. The image-gen prompt should aim for **reverberation** (Bachelard) — resonant depth — over literal illustration. Render in Chinese-painting-appreciation idiom: 留白 (negative space), brush-and-ink texture, atmospheric rather than photographic. The image becomes shared evidence all four agents reference in Phase A.

## Step 3 — 4-lens debate
Run the **横断面 protocol** (see `AGENT_DEBATE_DESIGN.md` §2): establish four independent View Cards (Freud, Jung, 周公解梦, Divination), inject 起卦 + 抽塔罗 as synchronistic evidence, then 求同存异 discussion (with the 存异 role-play step where each agent argues a rival's frame), with the philosophy referee bounding confidence and science grounding/vetoing any empirical claim. Oracles are *evidence injections weighted by lens*, never separate authorities.

**起卦 entry detail:** the dream's main image is mapped to **八卦类象** (火→离, 水→坎, 龙/雷→震, 山/止→艮, 泽→兑, 风/木→巽, 天→乾, 地→坤) — the SAME 类象 vocabulary the Chinese lens uses (`04_chinese.md` 梦象起卦) — then cast into 本卦/变卦 with moving lines, read via the Legge PD line/judgment text (Wilhelm framing labeled Western-received).

## Step 4 — Synthesis & guidance
Emit converged themes, preserved divergences, referee caveats, science flags, an image note, ONE actionable **建议**, and ONE **自我探寻** reflection prompt (e.g. "does this theme connect to anything on your mind lately?"), plus an explicit confidence envelope. Guidance is offered as one meaning-making frame among several; no lens "wins". Nightmares route to 周公's **梦禳** reassurance + Hartmann/IRT-style rescripting framing (clearly non-clinical, with a crisis-resource fallback), never bare doom or a prediction.

## Step 5 — Timeline log
Persist View Cards, oracle draws, **Hall–Van de Castle content codes** (characters, social/aggressive/friendly/sexual interactions, misfortunes/fortunes, emotions, settings, objects), and synthesis. Over a series this powers the **纵向 protocol** (individuation arc, Fool's-Journey position, 吉凶 drift, recurring symbols, turning points), with longitudinal confidence held *lower* than single-night confidence because each report is a reconstruction.

---

## The longitudinal layer — Hall–Van de Castle content coding (from `03` and `06`)

The neutral statistical backbone underneath all interpretive passes. Each logged dream is auto-coded into Hall–Van de Castle nominal categories and scored against published norms; recurrent **imagery** (chase ~80%, falling ~74%, flying ~50%, teeth ~19% baseline prevalences from Nielsen) is tracked over the timeline so the app can surface, e.g., "chase dreams have risen over the last three weeks, which research links to waking stress." This is `ground.science`'s continuity engine: reliable individual patterns need ~50–125+ dreams, so single-dream content claims are explicitly low-confidence. The same coded stream feeds Jung's dream-series individuation read, 周公's 吉凶/health-valence drift, and Divination's arc-progression — all reading the *trajectory*, never predicting events.

---

## How DeepSeek / Gemini prompts should consume this KB

1. **Load per-lens persona from the `作为辩论 Agent 的人设` notes, not ad-hoc.** Each agent's voice, signature moves, conflict triggers, and *mandatory self-flagged blind spots* are fixed by its dossier (`01`–`07`). The blind-spot flags are non-optional system instructions, not flavor — e.g. Freud must invoke the navel-of-the-dream stop; Divination must state the Forer caveat; Jung must mark dictionary entries as provisional; 周公 must 辨类而后断 and concede fatalism risk; Philosophy must bound confidence; Science must hold everyone to non-predictive framing.

2. **Use `symbol_dictionary.json` as a *seed*, not a verdict.** For an intake image, look up the entry and feed each tradition's `reading` to its agent as a *starting hypothesis*. Jung in particular must amplify rather than dictionary-lookup; 周公's reading is the lexicon valence to be filtered through dream-type classification; the Dream Science reading is a *common association with uncertainty*, never a determination.

3. **Enforce phase isolation.** In Phase A, give each agent only the imagery + image, NOT the other agents' outputs, so the four views are genuinely independent before anchoring. Only in Phase C do agents see each other and the oracle results, and run the 存异 role-play.

4. **Tag every symbol meaning with its source class.** Practitioner sources (Freud, Jung, Waite/Crowley/Fortune) supply working meanings; historians (Yates, Hanegraaff) are provenance only and do not endorse truth-claims; empirical science (`06`) is fact; philosophy (`07`) is argument. Prompts must not present Golden-Dawn correspondences as historically authentic to their source cultures, and must keep **周公解梦 (indigenous Chinese, owns the 八卦类象 vocabulary)** distinct from the **Western-received 起卦+Tarot** layer.

5. **Bound confidence explicitly.** Every synthesis must carry a confidence field and at least one philosophy-referee caveat. Trauma/nightmare loops route through *late* Freud (repetition compulsion) + 周公 梦禳 + IRT-style framing, not wish-fulfilment. Bodily-driven images (teeth→bruxism, falling/flying→vestibular) get the science-grounding low-confidence flag. Never claim a dream predicts the future (science flags precognition as selective recall).

6. **Honor source hygiene in retrieval.** When a prompt cites or links full text, only use the verified public-domain / open-access URLs: Brill 1900/1913 Gutenberg #66048; Hubback 1922 BPP; Hinkle 1916 Gutenberg #65903; 维基文库 for 周礼/潜夫论/列子/庄子/灵枢, Internet Archive scans for 梦占逸旨/梦林玄解; Waite PKT on sacred-texts; Legge I Ching on sacred-texts; open-access science (PMC Walker & van der Helm 2009; van der Helm 2011; Domhoff & Fox 2015; Voss 2009; Konkoly 2021; dreams.ucsc.edu coding rules); English-PD Descartes via Wikisource/Gutenberg #70091; Zhuangzi ctext Legge; Aristotle classics.mit.edu; Māṇḍūkya sacred-texts sbe15; SEP "Dreams and Dreaming". Avoid the known-bad links listed in `GAPS.md`.

7. **Output schema for each debate turn**: `{lens, headline_reading, key_symbols[], confidence, one_question_for_the_dreamer, stance_hooks[]}` in Phase A; `{consensus_nodes[], divergence_nodes[], referee_caveats[], science_flags[]}` in Phase C; `{converged_themes[], live_tensions[], referee_caveats[], science_flags[], image_note, 建议, 自我探寻, confidence_envelope}` in Phase D; `{arc_stage, recurring_symbols[], hvdc_trends[], turning_points[], divergent_forecasts[]}` in the 纵向 timeline. Stable schemas let DeepSeek/Gemini chain steps and let the timeline store comparable records for 纵向 analysis.
