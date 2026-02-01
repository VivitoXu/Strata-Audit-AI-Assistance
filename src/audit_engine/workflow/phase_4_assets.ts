/**
 * Phase 4 – Full Balance Sheet Verification (Owners Equity, Assets, Liabilities).
 * Apply GATE 2 logic to every line item on the Balance Sheet. No bank reconciliation or fund integrity tables.
 */

export const PHASE_4_ASSETS_PROMPT = `
PHASE 4 – FULL BALANCE SHEET VERIFICATION
Objective: Extract and verify EVERY line item from the Financial Statement Balance Sheet – Owners Equity, Assets, and Liabilities. **MANDATORY – You MUST apply GATE 2 logic (Phase 4 rules R1–R5) strictly per line-item type.**

**CRITICAL – bs_amount & line_item SOURCE:** Use LOCKED Step 0 core_data_positions.balance_sheet and bs_column_mapping to locate the Balance Sheet document and Current Year column. line_item and bs_amount MUST be copied ONLY from that FS Balance Sheet (Current Year column). Do NOT use General Ledger, Levy Report, Cash Summary, Owner Ledger, or any other document to fill bs_amount or line_item. **supporting_amount** is for verification ONLY – from non-BS evidence per R2–R5 (Bank Stmt, Levy Report, breakdown report, GL). **PROHIBITED:** Balance Sheet as source for supporting_amount; GL/ledger/summary as source for bs_amount.

**COMPLETENESS SOURCE OF TRUTH:** The authoritative row list is the physical FS Balance Sheet pages (page-by-page). bs_structure is a helper index only. If any mismatch exists, the page scan wins and bs_structure must be amended in output notes. **DATA ROW FILTER:** Do not output headings, blank lines, section titles, or subtotal labels unless they carry a numeric amount in the Current Year column.

**CRITICAL – COLUMN ANCHORING (MANDATORY):** For EVERY line item in balance_sheet_verification, you MUST:
1. Use bs_column_mapping.current_year_label to identify the Current Year column on the Balance Sheet (e.g., "2024", "30/06/2024", "Current Year").
2. Output a "year_column" field with the EXACT value of bs_column_mapping.current_year_label for every line item.
3. In the "note" field, explicitly state: "From BS column '{current_year_label}'" (e.g., "From BS column '2024'").
4. **PROHIBITED:** Do NOT use bs_column_mapping.prior_year_label for any line item except RULE 1 (Owners Funds at Start). If RULE 1 uses Prior Year, output year_column = bs_column_mapping.prior_year_label and note = "From BS column '{prior_year_label}' (Prior Year closing for roll-forward)".

**CRITICAL – COMPLETENESS:** balance_sheet_verification MUST include EVERY line item on the Balance Sheet. Scan the FS Balance Sheet page-by-page. Do NOT omit Owners Equity, Assets, or Liabilities. Every BS row = one output row.

**AUDIT PERIOD ANCHOR (global setting – use intake_summary.financial_year):** Use intake_summary.financial_year as the global audit period. **Current Year = the FY being audited.** Prior Year = the column immediately before it. If not yet in intake_summary, determine FY from minutes and write to intake_summary.

**CURRENT YEAR COLUMN ONLY – PROHIBITED to use Prior Year for RULES 2–5:**
- Extract amounts from the **CURRENT audit period / CURRENT YEAR column** only. **PROHIBITED:** Do NOT use Prior Year column for any line item except RULE 1 roll-forward.
- **Exception:** Use Prior Year column ONLY for RULE 1 (Owners Funds at Start = Prior Year Closing Balance). This is the ONLY line item allowed to use Prior Year. All other Owners Equity items (Retained Earnings, Accumulated Funds, etc.), all Assets, and all Liabilities MUST use Current Year column.
- **PROHIBITED:** Prior Year column values may NOT be used as supporting_amount or as a substitute evidence amount for any rule. supporting_amount MUST come from Current Year period evidence only (Bank Statement as at FY end, Levy Position Report as at FY end, etc.).
- If in doubt, verify column header says "Current Year" or "This Year" or the date falls within intake_summary.financial_year.

**FULL BALANCE SHEET SCOPE – extract ALL line items:**
- **Owners Equity:** Owners Funds at Start, Retained Earnings, Accumulated Funds, etc.
- **Assets:** Cash at Bank, Term Deposits, Levy Arrears, Levies in Advance (if asset), Accrued Receivables, Prepaid Expenses, Sundry Debtors, etc.
- **Liabilities:** Creditors, Accrued Expenses, Levies in Advance (if liability), Tax Liabilities, Unpaid Invoices, etc.

1. **MANDATORY** – Apply GATE 2 logic to balance sheet DATA ROWS only (not headers). Assign each line to section: OWNERS_EQUITY, ASSETS, or LIABILITIES.
2. **MANDATORY – supporting_amount evidence per line type (Phase 4 rules R2–R5):**
   - **Cash at Bank, Term Deposits:** supporting_amount MUST come from Bank Statement / TD Statement (Tier 1) ONLY. Do NOT use GL. If no Bank Stmt/TD Statement → status = "MISSING_BANK_STMT"; do NOT fill from GL.
   - **Levy Arrears, Levies in Advance:** supporting_amount from Tier 2 Levy Position Report; if only GL → status = "TIER_3_ONLY".
   - **Accrued/Prepaid/Creditors:** supporting_amount from Tier 2 breakdown report; if only GL → status = "MISSING_BREAKDOWN".
   - **Other items (RULE 5):** supporting_amount from GL.
3. For each line item, output: line_item, section, fund, bs_amount (from FS CURRENT YEAR column), year_column (MANDATORY – exact value from bs_column_mapping.current_year_label), supporting_amount (from permitted evidence per rules), evidence_ref (Doc_ID/Page), status (per Phase 4 rules), note.
4. **NOTE (AI explanation holder – same as Table E.Master Note/Source):** For every line item, generate a "note" that INCLUDES the column label (e.g., "From BS column '2024'", "Bank Statement p.2 as at FY end", "Levy Position Report p.1", "GL Cash reconciled"). Human-readable AI explanation – same purpose as Phase 2 master_table note.
`;
