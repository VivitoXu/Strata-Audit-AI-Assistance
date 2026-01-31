# Phase 1–5 细化规则（Item Rules）

本目录用于对 **Phase 1–5 中的具体 item** 做细化规则与指导，例如：

- **证据优先级**（evidencePriority）：如 receipt 优先采纳 bank_statement → levy_register → agent_receipt
- **白名单证据链**（whitelistDocTypes）：仅接受指定文档类型作为该 item 的有效证据
- **必选证据类型**（requiredEvidenceTypes）：缺一不可的证据类型
- **指导说明**（guidance）：注入 system prompt 的人类可读说明

## 目录与文件

- **`types.ts`**：规则类型定义（`PhaseItemRule`、`PhaseRulesMap` 等）
- **`phase_1_rules.ts`**：Phase 1 的 item 规则（示例：receipt、agm_minutes）
- **`phase_2_rules.ts`** … **`phase_5_rules.ts`**：按需新增，与 Phase 1 同结构
- **`index.ts`**：统一导出各 phase 的 `PHASE_X_RULES_PROMPT`，供 `audit_engine/index.ts` 注入

## 如何新增规则

1. **在已有 phase 下增加 item**：编辑对应 `phase_X_rules.ts`，在 `PHASE_X_ITEM_RULES` 中增加一项，例如：
   ```ts
   new_item: {
     evidencePriority: { doc_a: 1, doc_b: 2 },
     whitelistDocTypes: ["Doc A", "Doc B"],
     guidance: "…",
   },
   ```
2. **新增 Phase 2–5 的规则**：复制 `phase_1_rules.ts` 为 `phase_2_rules.ts`（或 3/4/5），按 Phase 2 的 item 填写规则，在 `rules/index.ts` 中导出 `PHASE_2_RULES_PROMPT`，并在 `audit_engine/index.ts` 的 `buildSystemPrompt()` 中在 `PHASE_2_REVENUE_PROMPT` 后追加 `PHASE_2_RULES_PROMPT`（Phase 3/4/5 同理）。

## 注入方式

各 `PHASE_X_RULES_PROMPT` 在 **buildSystemPrompt()** 中紧接在对应 `PHASE_X_VERIFY_PROMPT` / `PHASE_2_REVENUE_PROMPT` 等之后拼接，Kernel 会按「Phase 目标 + 本 Phase 的 item 规则」执行。
