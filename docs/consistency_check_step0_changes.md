# Step 0 更新 – 与下游 Phase / Rules / Output / Schema / Workflow 一致性检查报告

## 一、逻辑与数据流概览

```
Step 0 (intake)
  ├── document_register (Document_ID, Document_Type, ...)
  ├── intake_summary (financial_year, boundary_defined, bs_extract_warning, ...)
  ├── core_data_positions (doc_id = Document_ID)
  └── bs_extract (prior_year_label, current_year_label, rows[])

Phase 2 (Levy)     ← bs_extract.rows (PriorYear_*/CurrentYear_*)
Phase 3 (Expenses) ← intake_summary.manager_limit, agm_limit
Phase 4 (BS)       ← bs_extract.rows (bs_amount, line_item, fund, section)
Phase 5 (Compliance) ← 无 bs_extract 直接依赖
Phase 6 (Completion) ← boundary_disclosure 引用 missing_critical_types, Not Resolved
```

---

## 二、一致性检查结果

### ✅ 逻辑一致

| 检查项 | 状态 | 说明 |
|--------|------|------|
| bs_extract 结构 | 一致 | Step 0 输出 { prior_year_label, current_year_label, rows }，Phase 2/4、output_registry、schema 均匹配 |
| (line_item, fund, section) 匹配 | 一致 | Phase 4 明确要求三字段匹配；Step 0 每行均含这三项 |
| Document_ID ↔ doc_id | 一致 | Step 0 说明 "use Document_ID as doc_id"；core_data_positions 使用 doc_id；语义等价 |
| boundary_defined / bs_extract_warning | 已接入 | 已加入 type_definitions、schema_definitions、output_registry、index.ts |
| Phase 2 bs_extract 来源 | 一致 | Phase 2 rules/workflow/output_registry 均要求从 LOCKED bs_extract 取值 |
| Phase 4 bs_extract 来源 | 一致 | Phase 4 rules/workflow/output_registry 均禁止重读 BS PDF，强制使用 bs_extract |
| Receivable 空值处理 | 一致 | Step 0 与 Phase 4 均要求 current_year 为空时记 0，不代 prior_year |
| RULE 1 (Owners Equity) | 一致 | bs_amount = current_year，supporting_amount = prior_year；Step 0 与 Phase 4 对齐 |
| supporting_amount = null | 一致 | Phase 4 rules/output 均要求缺证时用 null 而非 0 |

### ⚠️ 潜在不一致 / 改进点

| 序号 | 位置 | 问题 | 建议 |
|------|------|------|------|
| 1 | Phase 4 rules L139 | MISSING EVIDENCE 段写 "supporting_note MUST state 'Subtotal – not independently vouched'"，应为 SUBTOTAL_CHECK_ONLY 的说明 | 将 MISSING_* 的 supporting_note 改为如 "Evidence missing" 或类似表述，与 Subtotal 区分 |
| 2 | Phase 2 / Phase 4 workflow | "If not present, derive FY from minutes and write to intake_summary" | Call 2 下 Step 0 已锁定，phase 不应写入 intake_summary。建议改为 "Use intake_summary.financial_year; if empty (boundary_defined) → Not Resolved" |
| 3 | Phase 6 / geminiReview completion | boundary_disclosure 仅引用 missing_critical_types 和 Not Resolved | 建议补充：boundary_defined、bs_extract_warning 也应纳入 boundary_disclosure 的触发条件 |
| 4 | AuditReport.tsx | bs_extract 存在但 rows=[]（HARD STOP）时，显示 "Run Step 0 to export Balance Sheet extract" | 建议：若 boundary_defined 或 bs_extract_warning，则展示相应提示，而非误导性 "Run Step 0" |
| 5 | geminiReview.js Step 0 only | 仍为简短说明，未包含 E-PRIMARY/SECONDARY/TERTIARY、HARD STOP 等新逻辑 | 主 prompt 在 step_0_intake.ts 中，Cloud Function 可能未注入完整 Step 0 prompt；需确认 Call 2 step0_only 是否使用完整 prompt |

---

## 三、Schema / Output 对齐

| 结构 | Step 0 输出 | Schema (Zod) | Output Registry | Phase 消费 |
|------|-------------|--------------|-----------------|------------|
| document_register | Document_ID, Document_Type, ... | DocumentEntrySchema ✓ | ✓ | Phase 2/4 引用 doc_id |
| intake_summary | boundary_defined, bs_extract_warning | IntakeSummarySchema ✓ | ✓ | Phase 2/4/6 用 financial_year |
| bs_extract.rows | line_item, section, fund, prior_year, current_year | BsExtractRowSchema ✓ | ✓ | Phase 2 按语义聚合；Phase 4 按 (line_item, fund, section) |
| core_data_positions | doc_id, page_range | DocLocation ✓ | ✓ | Phase 2/4 用 balance_sheet 做 forensic |

---

## 四、Workflow 执行顺序

- Step 0：先确定列映射 (E1–E3)，再锁定，再提取行 (F)。
- Phase 2：用 intake_summary.financial_year，从 bs_extract.rows 取 PriorYear_*/CurrentYear_*。
- Phase 4：以 bs_extract.rows 为权威行表，逐行匹配 (line_item, fund, section)，输出 balance_sheet_verification。

无循环依赖，顺序合理。

---

## 五、HARD STOP（rows=[]）场景

| 下游 | 行为 | 是否合理 |
|------|------|----------|
| Phase 2 | bs_extract missing or no matching rows → Not Resolved – Boundary Defined | ✓ |
| Phase 4 | "Output one row for each row in bs_extract.rows" → 0 行 | ✓ |
| UI (AuditReport) | rows.length === 0 时显示 "Run Step 0..." | ⚠️ 应区分 boundary_defined / bs_extract_warning |

---

## 六、建议修复优先级

1. **P1**：Phase 4 rules L139 – 修正 MISSING_* 的 supporting_note 说明。
2. **P2**：AuditReport – 在 rows=[] 时，根据 boundary_defined / bs_extract_warning 显示正确提示。
3. **P3**：Phase 6 / completion – 在 boundary_disclosure 中纳入 boundary_defined、bs_extract_warning。
4. **P4**：Phase 2/4 workflow – 在 Call 2 模式下明确不得写入 intake_summary，统一为仅使用已有 financial_year。
