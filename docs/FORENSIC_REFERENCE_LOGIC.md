# Forensic 引用逻辑梳理（文件、页码、PDF 链接）

## 一、Forensic 数据从哪来

### 1. 通用链路

- **ForensicCell** 组件接收一个 **TraceableValue**（`val`），以及 `docs`（document_register）、`files`（用户上传的文件列表）。
- **TraceableValue** 包含：`amount`, `source_doc_id`, `page_ref`, `note`, `verbatim_quote?`, `computation?`。
- **文件解析**：用 `val.source_doc_id` 在 `document_register` 里找 Document（先严格匹配 Document_ID，再回退到 Document_Origin_Name / Document_Name）；再用该 Document 的 `Document_Origin_Name` 在 `files` 里找物理 File。
- **页码**：从 `val.page_ref`（或 `val.note`）用 `extractPageNumber()` 抽页码，打开 PDF 时用 `#page=N` 定位。
- **PDF 链接**：`URL.createObjectURL(targetFile)` 得到当前会话中的文件 Blob URL，加上 `#page=N` 在弹窗里用 iframe 打开。

所以：**Forensic 里显示的文件、页码、PDF 链接，都来自当前单元格对应的 TraceableValue 的 `source_doc_id` 和 `page_ref`**；若 API 没给或给错，UI 就会显示错或“Unknown”。

---

## 二、不同表的数据来源

### 2.1 Table E.Master（Levy / Revenue）

- **数据结构**：`levy_reconciliation.master_table` 里**每个字段**都是完整的 **TraceableValue**（例如 `Op_Arrears`, `Total_Gross_Inc`, `Effective_Levy_Receipts`），各自带有 `source_doc_id`, `page_ref`, `note`, `verbatim_quote`, `computation`。
- **UI**：每个格子直接把对应字段（如 `master_table.Total_Gross_Inc`）传给 ForensicCell，因此 **Doc ID、页码、PDF 链接都是该字段自己的来源**，逻辑一致。
- **结论**：Levy 表里“数的来源”和“Forensic 引用”是同一套字段，显示正确。

### 2.2 Table C.3（Phase 4 Full Balance Sheet Verification）

- **数据结构**：`balance_sheet_verification[]` 每行是一个 **BalanceSheetVerificationItem**，只有：
  - `line_item`, `section`, `fund`
  - `bs_amount`（数字）
  - `supporting_amount`（数字）
  - **一个** `evidence_ref`（字符串，形如 `"Doc_ID/Page"`，例如 `"Sys_002/Page 3"`）
  - `status`, `note`
- **关键点**：**整行只有一个 evidence_ref**，没有单独的 `bs_source_doc_id` / `bs_page_ref` 和 `supporting_source_doc_id` / `supporting_page_ref`。Prompt 里只要求“evidence_ref: Doc_ID/Page for traceability”，没有区分“BS 用哪个文档、Supporting 用哪个文档”。

---

## 三、Table C.3 当前 UI 行为（问题所在）

当前代码（AuditReport.tsx 中 Table C.3 渲染）逻辑是：

```ts
const evRef = item.evidence_ref || '';
const evParts = evRef.split(/[/,]/);
const srcId = evParts[0]?.trim() || '-';
const pageRef = evParts[1]?.trim() || evRef;
const bsTrace  = { amount: item.bs_amount,  source_doc_id: srcId, page_ref: pageRef, note: item.note };
const supTrace = { amount: item.supporting_amount, source_doc_id: srcId, page_ref: pageRef, note: item.note };
// BS Amount 列 用 <ForensicCell val={bsTrace} />
// Supporting 列 用 <ForensicCell val={supTrace} />
```

也就是说：

- **BS Amount ($)** 和 **Supporting ($)** 两列用的 **是同一个** `source_doc_id` 和 `page_ref`，都来自**唯一的** `item.evidence_ref`。
- 而 AI 在写 Phase 4 输出时，通常会把 `evidence_ref` 填成**验证时用的那份证据**（Bank Statement、Levy Report、GL 等），即 **Supporting 的来源**，不会单独再填“BS 来自哪一页”。

因此会出现你看到的情况：

- **BS Amount ($)** 列：数字按规则应来自 **Balance Sheet（FS）**，但 Forensic 弹窗里的 **文件/页码/PDF 链接** 用的是 `evidence_ref`，所以显示的是 **Supporting 文档**（例如 Bank Statement、Levy Report），而不是 Balance Sheet。
- **Supporting ($)** 列：数字和引用都来自同一份证据，所以显示一致、是对的。

结论可以拆成两点：

1. **数的来源**：  
   - 若 AI 严格按 prompt 只从 BS 抄 `bs_amount`，那 **bs_amount 的数值** 是对的，只是 **Forensic 引用错了**（引用成了 Supporting 的文档）。  
   - 若 AI 仍从 GL/Supporting 抄了 `bs_amount`，那是 **数的来源错误**，需要继续靠 prompt/规则约束。

2. **PDF / Forensic 引用**：  
   - 对 **BS Amount ($)** 列来说，**引用一定是错的**：当前 schema 只有一条 `evidence_ref`，UI 又把它同时用在 BS 和 Supporting 两列，所以 BS 列会显示成 Supporting 的文件/页码/链接。  
   - 这是 **schema 设计 + UI 使用方式** 的问题，不是“数本身从哪来”的问题。

---

## 四、总结表

| 项目 | Table E.Master (Levy) | Table C.3 Phase 4 |
|------|------------------------|--------------------|
| 每格是否有独立 source_doc_id / page_ref | 有（每个 TraceableValue 自带） | 否（整行共用一个 evidence_ref） |
| Forensic 显示是否与“数的来源”一致 | 一致 | **BS Amount 列不一致**：数应来自 BS，引用显示的是 Supporting 文档 |
| 根因 | - | 只有一条 evidence_ref，且多被填成 Supporting 文档；UI 又把它同时赋给 BS 和 Supporting 两列 |

---

## 五、建议改动方向

1. **Schema / API**  
   - 为 Phase 4 每行增加 **BS 的引用**，例如：  
     - `bs_evidence_ref`（或 `bs_source_doc_id` + `bs_page_ref`），表示 bs_amount 来自哪份文档哪一页（应为 FS Balance Sheet）；  
     - 保留现有 `evidence_ref` 专门表示 Supporting 证据（或改名为 `supporting_evidence_ref`）。  
   - Prompt 里明确：bs_amount 必须来自 FS Balance Sheet，并填写 bs_evidence_ref；supporting_amount 来自 R2–R5 证据，并填写 evidence_ref。

2. **UI**  
   - **BS Amount ($)** 列：用 **bs_evidence_ref**（或 bs_source_doc_id + bs_page_ref）构造 TraceableValue 传给 ForensicCell；若没有则显示“Balance Sheet (Current Year)”等文案，且不提供错误的 PDF 链接。  
   - **Supporting ($)** 列：继续用现有 **evidence_ref** 构造 TraceableValue。  
   - 这样 BS 列的 Forensic 就只指向 Balance Sheet，Supporting 列只指向 Supporting 证据，数和引用都一致。

3. **短期不改 API 的折中**  
   - 若暂不改 schema：在 UI 里对 **BS Amount** 列不沿用 `evidence_ref`，而是显示固定说明（如 “From Financial Statement Balance Sheet (Current Year column)”），并注明“BS 金额来源为报表，此处不链接 Supporting 证据”，避免误导。

以上是当前 Forensic 引用逻辑以及 Table C.3 中“BS Amount 显示成 Supporting 文件”的完整原因与可选改法。
