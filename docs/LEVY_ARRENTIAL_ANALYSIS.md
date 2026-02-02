# Levies in Arrears & Levies in Advance – 字段命名重构说明

## 问题描述（已解决）

用户反馈：Table E.Master 中 Levies in Arrears 与 (Less) Levies in Advance 的 **Opening** 与 **Closing** 余额，AI 时常颠倒、识别反。

**根因分析：**
- 字段名 `Op_Arrears` / `BS_Arrears` 使用会计术语（Opening/Closing），AI 需要推理「Opening = Prior Year 列」「Closing = Current Year 列」。
- 这层推理容易出错，导致列混淆。

---

## 解决方案（已实施）

**核心改动：** 将字段名从会计术语改为列术语，使字段名本身就是指令。

| 旧字段名 | 新字段名 | 含义 | 来源 |
|----------|----------|------|------|
| `Op_Arrears` | `PriorYear_Arrears` | 期初拖欠 | Prior Year Balance Sheet 列 |
| `Op_Advance` | `PriorYear_Advance` | 期初预收 | Prior Year Balance Sheet 列 |
| `Net_Opening_Bal` | `PriorYear_Net` | 净期初余额 | 计算: PriorYear_Arrears - PriorYear_Advance |
| `BS_Arrears` | `CurrentYear_Arrears` | 期末拖欠 | Current Year Balance Sheet 列 |
| `BS_Advance` | `CurrentYear_Advance` | 期末预收 | Current Year Balance Sheet 列 |
| `BS_Closing` | `CurrentYear_Net` | 净期末余额 | 计算: CurrentYear_Arrears - CurrentYear_Advance |

**公式（保持不变，仅字段名更新）：**
- PriorYear_Net (A) = PriorYear_Arrears - PriorYear_Advance
- CurrentYear_Net (G) = CurrentYear_Arrears - CurrentYear_Advance
- Calc_Closing (=) = PriorYear_Net + Total_Gross_Inc - Effective_Levy_Receipts
- Levy_Variance = Calc_Closing - CurrentYear_Net

---

## 设计理念

### 字段名 = 列指令

**旧方式（需推理）：**
```
Op_Arrears → "Op" = Opening → Opening = 期初 → 期初 = Prior Year closing → 用 Prior Year 列
```
推理链长，易出错。

**新方式（直接指令）：**
```
PriorYear_Arrears → 用 Prior Year 列
```
字段名本身就是指令，无需推理。

### 与 Step 0 列识别一致

Step 0 已输出：
- `bs_column_mapping.prior_year_label` = Prior Year 列标签
- `bs_column_mapping.current_year_label` = Current Year 列标签

Phase 2 字段名直接对应：
- `PriorYear_*` → 用 `prior_year_label` 对应的列
- `CurrentYear_*` → 用 `current_year_label` 对应的列

---

## 已修改的文件

| 文件 | 修改内容 |
|------|----------|
| `src/audit_outputs/type_definitions.ts` | TypeScript 接口字段名 |
| `src/audit_outputs/schema_definitions.ts` | Zod schema 字段名 |
| `functions/auditResponseSchema.json` | JSON Schema 字段名 |
| `src/audit_outputs/output_registry.ts` | MODULE 50_OUTPUTS prompt 字段名和公式 |
| `src/audit_engine/workflow/phase_2_revenue.ts` | Phase 2 prompt 术语 |
| `src/audit_engine/rules/phase_2_rules.ts` | Phase 2 rules 术语（COLUMN MAP、OPENING/CLOSING → PRIOR YEAR/CURRENT YEAR） |
| `functions/geminiReview.js` | Cloud Function userInstruction 术语 |
| `components/AuditReport.tsx` | UI 字段引用和标签 |

---

## UI 标签更新

**Prior Year (Opening) 区域：**
- 标题："Prior Year (Opening)"
- 行："Levies in Arrears" → `PriorYear_Arrears`
- 行："(Less) Levies in Advance" → `PriorYear_Advance`
- 小计："(A) NET PRIOR YEAR" → `PriorYear_Net`

**Current Year (Closing) 区域：**
- 标题："Current Year (Closing) per Balance Sheet"
- 行："Levies in Arrears" → `CurrentYear_Arrears`
- 行："Levies in Advance" → `CurrentYear_Advance`
- 小计："(G) NET CURRENT YEAR" → `CurrentYear_Net`

---

## Arrears / Advance 识别规则（保持不变）

| 项目 | 属性 | 说明 |
|------|------|------|
| Levies in Arrears | Dr（借方）| 资产，业主欠物业 |
| Levies in Advance | Cr（贷方）| 负债，物业欠业主未来服务 |

若 Balance Sheet 上只有单一「Levy Receivable」行：
- Dr 余额 → 视为 Arrears
- Cr 余额 → 视为 Advance

---

*本文档记录字段命名重构的设计理念和实施范围。*
