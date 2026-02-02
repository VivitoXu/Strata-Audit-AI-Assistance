/**
 * Phase 4 – Full Balance Sheet Verification (Owners Equity, Assets, Liabilities).
 * Apply GATE 2 logic to every Balance Sheet line item.
 * NO bank reconciliation tables. External vouching only.
 */

export const PHASE_4_ASSETS_PROMPT = `
PHASE 4 – FULL BALANCE SHEET VERIFICATION
Objective: Extract and verify EVERY line item from the Financial Statement Balance Sheet – Owners Equity, Assets, and Liabilities.

MANDATORY: You MUST apply GATE 2 logic (Phase 4 Rules R1–R5) strictly per line-item type.

────────────────────────────────────────
SECTION A – LOCKED EXTRACTION RULES (DO NOT VIOLATE)
────────────────────────────────────────

CRITICAL – bs_amount & line_item SOURCE (LOCKED bs_extract):
- bs_amount and line_item MUST be looked up from LOCKED Step 0 bs_extract ONLY. Do NOT re-read the Balance Sheet PDF.
- For each row in balance_sheet_verification: find the matching row in bs_extract.rows (by line_item). Use current_year for bs_amount (except RULE 1).

PROHIBITED:
- Do NOT use General Ledger, Levy Reports, Bank Statements, or any non-bs_extract source for bs_amount or line_item.
- Do NOT substitute ledger figures if bs_extract is missing or has no matching row.

CRITICAL – COMPLETENESS SOURCE OF TRUTH:
- The authoritative row list is LOCKED bs_extract.rows. Output one balance_sheet_verification row for each row in bs_extract.rows.

DATA ROW FILTER:
- Output ONLY Balance Sheet rows that carry a numeric amount in the Current Year column.
- Do NOT output section headers or titles.
- Subtotals WITH numeric amounts MUST be included and flagged as SUBTOTAL_CHECK_ONLY.

────────────────────────────────────────
SECTION B – bs_amount FROM bs_extract (MANDATORY)
────────────────────────────────────────

For EVERY output row:
1. Find matching row in bs_extract.rows by line_item.
2. year_column = bs_extract.current_year_label (or prior_year_label for RULE 1 only).
3. bs_amount = matching row's current_year (or prior_year for RULE 1 only).
4. note = "BS: From bs_extract current_year" (or "prior_year for roll-forward" for RULE 1).

RULE 1 EXCEPTION – "Owners Funds at Start of Year":
- bs_amount = prior_year from bs_extract (Prior Year closing for roll-forward).
- year_column = bs_extract.prior_year_label.

PROHIBITED:
- Do NOT use prior_year for ANY other line item. All others use current_year.

────────────────────────────────────────
SECTION C – SCOPE & CLASSIFICATION
────────────────────────────────────────

FULL BALANCE SHEET SCOPE:
You MUST include EVERY Balance Sheet line item:
- OWNERS_EQUITY
- ASSETS
- LIABILITIES

Assign each line item to ONE section only.

fund field:
- fund MUST be taken from the Balance Sheet presentation (Admin, Capital, Sinking, etc.).
- If no fund split exists, output fund = "TOTAL" and explain in note.

────────────────────────────────────────
SECTION D – AUDIT PERIOD ANCHOR
────────────────────────────────────────

AUDIT PERIOD:
- Use intake_summary.financial_year as the audit period.
- CURRENT YEAR = the FY under audit.
- Prior Year = the column immediately before it.
- If not present, derive FY from meeting minutes and write to intake_summary.

────────────────────────────────────────
SECTION E – VERIFICATION (GATE 2 LOGIC)
────────────────────────────────────────

For EACH extracted Balance Sheet line item:
- Apply Phase 4 Rules R1–R5 (see rules prompt).
- supporting_amount is for VERIFICATION ONLY.
- supporting_amount MUST come from permitted NON-BS evidence per rule.

STRICT SOURCE SEPARATION:
- bs_amount source = Balance Sheet ONLY.
- supporting_amount source = NON-BS evidence ONLY (except RULE 1 exception).

If required evidence is missing:
- Set appropriate MISSING_* status.
- supporting_amount = 0 and evidence_ref = "".
- Do NOT substitute with GL.

────────────────────────────────────────
SECTION F – OUTPUT FIELDS (MANDATORY)
────────────────────────────────────────

For EACH Balance Sheet row, output ONE row with:
- line_item
- section (OWNERS_EQUITY / ASSETS / LIABILITIES)
- fund
- bs_amount
- year_column
- supporting_amount
- evidence_ref (Doc_ID/Page)
- status
- note
- supporting_note

NOTE FIELD STRUCTURE (MANDATORY – TWO SEPARATE FIELDS):
- note = bs_amount source ONLY. Example: "BS: From BS column '2024'" or "BS: From BS column 'Prior Year' (roll-forward)". Do NOT include supporting evidence.
- supporting_note = supporting_amount source ONLY. Example: "Matches Macquarie Investment Account Statement 2036-74072", "Bank Statement p.2 as at FY end". Do NOT include "From BS column".
- For SUBTOTAL_CHECK_ONLY rows: supporting_amount = 0, evidence_ref = "", supporting_note = "Subtotal – not independently vouched".

Global tolerance:
- Absolute tolerance = 1.00
- Normalize signs before comparison.

END PHASE 4
`;
