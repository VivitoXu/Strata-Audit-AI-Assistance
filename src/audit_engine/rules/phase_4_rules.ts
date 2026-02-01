/**
 * Phase 4 – Assets 阶段的验证规则。
 * 注入到 system prompt 中。
 */

import type { PhaseItemRule, PhaseRulesMap } from "./types";

export const ASSET_VERIFICATION_RULES_PROMPT = `
   [GATE 2 LOGIC - FULL BALANCE SHEET: Owners Equity, Assets, Liabilities] – MANDATORY ENFORCEMENT
   [AUDIT PERIOD: Use CURRENT YEAR column for all amounts. Prior Year column ONLY for RULE 1 roll-forward. See Phase 4 workflow for FY anchor.]

   --- ONE-LINE SOURCE RULE (DO NOT VIOLATE) ---
   **bs_amount sole source** = Financial Statement Balance Sheet (Current Year column) ONLY. **supporting_amount sole source** = non-BS evidence per R2–R5 ONLY (Bank Stmt, Levy Report, breakdown report, GL). **PROHIBITED:** Balance Sheet as source for supporting_amount; GL, ledger, TB, or any non-BS document as source for bs_amount or line_item. **PROHIBITED:** Prior Year column values may NOT be used as supporting_amount or as a substitute evidence amount for any rule.

   --- FOUNDATIONAL RULE – bs_amount & line_item SOURCE (DO NOT VIOLATE) ---
   **bs_amount and line_item** MUST be extracted SOLELY from the **Balance Sheet (Financial Statement)**. Use LOCKED Step 0 core_data_positions.balance_sheet and bs_column_mapping to locate the Balance Sheet document and Current Year column. Copy bs_amount and line_item ONLY from that FS Balance Sheet (Current Year column). Do NOT use General Ledger, Trial Balance, Levy Position Report, Levy Summary, Cash Summary, Owner Ledger, Fund Ledger, or any other document to populate bs_amount or line_item.
   - **COMPLETENESS SOURCE OF TRUTH:** The authoritative row list is the physical FS Balance Sheet pages (page-by-page). bs_structure is a helper index only. If any mismatch exists, the page scan wins and bs_structure must be amended in output notes.
   - **DATA ROW FILTER:** Do not output headings, blank lines, section titles, or subtotal labels unless they carry a numeric amount in the Current Year column.
   - The Balance Sheet is the SOLE source for "what" appears in balance_sheet_verification. Copy line_item names and amounts EXACTLY as they appear on the Balance Sheet (Current Year column).
   - **supporting_amount** is the verification evidence – from Bank Statement (R2), Levy Report (R3), breakdown report (R4), or GL (R5) per rules. supporting_amount is used to VERIFY bs_amount; it is NOT the source of bs_amount. Do NOT use the Balance Sheet as source for supporting_amount.
   - PROHIBITED: Filling bs_amount from GL, ledger, or summary. If the Balance Sheet is missing or unreadable, mark accordingly; do NOT substitute with ledger figures.

   --- COLUMN ANCHORING RULE (MANDATORY – DO NOT VIOLATE) ---
   For EVERY line item in balance_sheet_verification, you MUST output a "year_column" field with the EXACT column label from bs_column_mapping.current_year_label (e.g., "2024", "30/06/2024", "Current Year"). In the "note" field, explicitly state: "From BS column '{current_year_label}'" (e.g., "From BS column '2024'"). This ensures bs_amount is from the correct year and prevents accidental use of Prior Year data.
   - **RULE 1 EXCEPTION ONLY:** For "Owners Funds at Start of Year" (RULE 1 roll-forward), if you use Prior Year column, output year_column = bs_column_mapping.prior_year_label and note = "From BS column '{prior_year_label}' (Prior Year closing for roll-forward)".
   - **PROHIBITED:** Do NOT use bs_column_mapping.prior_year_label for any other line item. All other Owners Equity items (Retained Earnings, Accumulated Funds, etc.), all Assets, and all Liabilities MUST use bs_column_mapping.current_year_label.

   --- COMPLETENESS RULE – ALL BALANCE SHEET ITEMS (MANDATORY) ---
   balance_sheet_verification MUST include **every line item** that appears on the Financial Statement Balance Sheet – Owners Equity, Assets, Liabilities. Scan the Balance Sheet page-by-page. Do NOT omit any row. Every Balance Sheet data row = one row in balance_sheet_verification. If a line appears on the BS, it MUST appear in the output.

   RULE 1: OWNERS EQUITY – ROLL-FORWARD CHECK
   - Target: "Owners Funds at Start of Year" (Admin & Capital) ONLY.
   - **CRITICAL:** This is the ONLY line item allowed to use Prior Year column. All other Owners Equity items (Retained Earnings, Accumulated Funds, Surplus, etc.) MUST use Current Year column.
   - Action: Check if this equals the "Closing Balance" of the PREVIOUS YEAR column on the Balance Sheet itself.
   - Status: If mismatch > $1.00 -> "VARIANCE". If match -> "VERIFIED".

   RULE 2: CASH & INVESTMENTS (ASSETS – EXTERNAL VERIFICATION)
   - Target: "Cash at Bank", "Term Deposits", "Investment Accounts" (Admin & Capital).
   - PERIOD: Extract from CURRENT YEAR column / Bank Statement as at FY end ONLY. Do NOT use Prior Year column or prior period statements.
   - TIER 1 EVIDENCE (MANDATORY - EXTERNAL): 
     1. Bank Statement
     2. Term Deposit / Investment Account Statement
     3. Balance Notice from Bank
   - Constraint: Do NOT use General Ledger (Tier 3) as primary evidence. 
   - Status: If Tier 1 doc found & matches -> "VERIFIED". If not found -> "MISSING_BANK_STMT".

   RULE 3: LEVY RECEIVABLES & PREPAID (ASSETS / LIABILITIES – SUB-LEDGER VERIFICATION)
   - Target: "Levy Arrears" (Assets) and "Levies in Advance" (Assets or Liabilities depending on FS presentation).
   - PERIOD: Extract from CURRENT YEAR column / report as at FY end ONLY. Do NOT use Prior Year column or prior period reports.
   - TIER 2 EVIDENCE (PRIMARY - INTERNAL AUTHORITATIVE):
     * Definition: A "Levy Position-Equivalent Report" MUST be lot-based, date-anchored (as at FY end), and show balances (owing and/or prepaid) separately for Admin and Capital/Sinking. Reports showing only transactions/receipts without balances do NOT qualify.
     * Accepted Names: Levy Position Report, Levy Arrears Report, Owner Balance Report, Owner Balances, Owner Ledger, Aged Levies, Aged Owner Balances, Aged Receivables (Levies), Levy Register, Levy Contributions by Lot, Owner Account Balances, Levy Summary by Lot.
     * **PROHIBITED:** Levy Receipts Reports, Cash Management Reports, or transaction-only summaries that do not show owing/prepaid balances are NOT Tier 2 evidence for RULE 3.
   - TIER 3 EVIDENCE (SECONDARY - REFERENCE ONLY):
     * Examples: General Ledger, Levy posting schedules.
   - Status:
     * If Tier 2 Doc found & matches -> "VERIFIED".
     * If only Tier 3 Doc found -> "TIER_3_ONLY" (Treat as risk, Missing Sub-ledger).
     * If no evidence -> "MISSING_LEVY_REPORT".

   RULE 4: ACCRUED & PREPAID / CREDITORS (ASSETS & LIABILITIES – BREAKDOWN REQUIREMENT)
   - Target: "Accrued Expenses", "Creditors", "Unpaid Invoices" (Liabilities); "Prepaid Expenses", "Prepayments", "Insurance Prepayments" (Assets).
   - PERIOD: Extract from CURRENT YEAR column / report as at FY end ONLY. Do NOT use Prior Year column.
   - TIER 2 EVIDENCE (PRIMARY - INTERNAL AUTHORITATIVE):
     * Definition: A breakdown-style report identifying individual components as at reporting date.
     * Accepted Names: Accrued Expenses Report, Unpaid Invoices / Creditors Report, Prepaid Expenses / Allocation Schedule, Aged Creditors Report.
   - TIER 3 EVIDENCE (SECONDARY - REFERENCE ONLY):
     * General Ledger or Trial Balance.
   - PROHIBITED: GL or FS notes used alone to justify balances.
   - Status:
     * If Tier 2 found & matches -> "VERIFIED".
     * If only Tier 3 found -> "MISSING_BREAKDOWN" (Risk).
     * If no evidence -> "NO_SUPPORT".

   RULE 5: GENERAL VOUCHING (ALL OTHER ITEMS – ASSETS & LIABILITIES)
   - Target: Sundry Debtors (Assets), Utility Deposits (Assets), Tax Liabilities (Liabilities), Retained Earnings (Owners Equity), Other.
   - **CRITICAL – RULE 5 MAY NOT be applied to any item that matches RULE 2–4 categories.** If an item could fit R2 (Cash/Investments), R3 (Levy Arrears/Advance), or R4 (Accrued/Prepaid/Creditors), you MUST apply the stricter rule even if evidence is missing. Do NOT use RULE 5 as a fallback to avoid "MISSING" statuses.
   - PERIOD: Extract from CURRENT YEAR column / GL as at FY end ONLY. Do NOT use Prior Year column.
   - Action: Search General Ledger (Tier 3).
   - Status: If only GL evidence exists for an item that is not eligible for Tier 1/2 evidence, status = "GL_SUPPORTED_ONLY" (not "VERIFIED"). If GL matches within $1.00 -> "GL_SUPPORTED_ONLY"; if difference > $1.00 -> "VARIANCE".

   - Field "supporting_amount": The amount found in the support document.
   - Field "evidence_ref": Document ID/Page (e.g. Sys_001/Page 2) for traceability.
   - Field "note": AI explanation (same as Table E.Master Note/Source). Human-readable source context (e.g. "Bank Statement p.2 as at FY end", "Current Year BS column").
`;

export const PHASE_4_ITEM_RULES: PhaseRulesMap = {};

export const PHASE_4_RULES_PROMPT = ASSET_VERIFICATION_RULES_PROMPT;
