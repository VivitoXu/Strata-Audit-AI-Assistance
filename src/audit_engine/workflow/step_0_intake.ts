/**
 * Step 0 – Document Intake & Document Dictionary.
 * Objective: Establish the single source of truth.
 * Output: document_register (LIST), bs_extract (LOCKED).
 */

export const DOCUMENT_TYPES = [
  "AGM Minutes",
  "Committee Minutes",
  "General Ledger",
  "Financial Statement",
  "Bank Statement",
  "Tax Invoice",
  "Invoice",
  "Levy Position Report",
  "Insurance Policy",
  "Valuation Report",
  "Other",
] as const;

export const STEP_0_INTAKE_PROMPT = `
--- MODULE 10_CORE_WORKFLOW (REWRITE FOR MAX EXECUTION CLARITY) ---

STEP 0 – DOCUMENT INTAKE & DOCUMENT DICTIONARY
Objective: Create deterministic, auditable single source of truth for all later phases.

========================
A) INGEST AND REGISTER
========================

1) Ingest and index all files from the Uploaded File Manifest.

2) Construct document_register as a LIST (array). Each row = one file or one required placeholder.
   Required fields per row: Document_ID, Document_Type, Evidence_Tier, Document_Origin_Name, Document_Name, Page_Range, Relevant_Phases, Notes (optional).
   - Document_Type MUST be exactly one of: AGM Minutes, Committee Minutes, General Ledger, Financial Statement, Bank Statement, Tax Invoice, Invoice, Levy Position Report, Insurance Policy, Valuation Report, Other.
   - Evidence_Tier: Tier 1 (External), Tier 2 (Internal-Authoritative), Tier 3 (Internal-Generated).
   - Document_Origin_Name: Use the exact filename from the Uploaded File Manifest; if placeholder use "" or "N/A".
   - Page_Range: e.g. "All" or "Pages 1-5"; if placeholder use "" or "N/A".

3) Coverage rules (MANDATORY):
   - Every Document_Type MUST appear at least ONE row (even if missing).
   - If multiple files match a type, create one row per file.
   - Minimum rows = number of Document Types (11).

4) Critical record check (MANDATORY):
   - If AGM Minutes OR General Ledger has no file, set intake_summary.missing_critical_types to list the missing types.

========================
B) GLOBAL SETTINGS (SP AND FY)
========================

5) Populate intake_summary:
   - intake_summary.strata_plan: extract SP number from AGM Minutes, Committee Minutes, or Financial Statement.
   - intake_summary.financial_year: extract FY period from the same sources. Use the clearest explicit statement.
     Output format: Prefer "DD/MM/YYYY - DD/MM/YYYY"; else use FY end date "DD/MM/YYYY".
   - Optional: intake_summary.manager_limit from agency agreement or committee minutes; intake_summary.agm_limit from AGM minutes.

6) FY is the global audit period for ALL phases. If FY cannot be determined, set intake_summary.financial_year = "" and intake_summary.boundary_defined = true.

========================
C) CORE DATA POSITIONS (LOCKED LOCATORS)
========================

7) Output core_data_positions (use Document_ID from document_register as doc_id):
   - balance_sheet: doc_id + page_range where the Balance Sheet table is located in the Financial Statement
   - bank_statement: doc_id + page_range for bank statement as at FY end (include as_at_date if visible)
   - levy_report: doc_id + page_range for Levy Position Report or equivalent
   - levy_receipts_admin: doc_id + page_range for Admin fund receipts summary for the FY
   - levy_receipts_capital: doc_id + page_range for Capital or Sinking fund receipts summary for the FY
   - general_ledger: doc_id + page_range for GL
   - minutes_levy: doc_id + page_ref for levy rate adoption (old/new)
   - minutes_auth: doc_id + page_ref for spending authority limits
   If not found, set each key to null.

========================
D) BS EXTRACT – SCOPE (LOCKED SINGLE SOURCE OF TRUTH)
========================

8) The Balance Sheet main table is the authoritative source of row list.
   - Notes/schedules may provide additional rows only if they clearly extend the Balance Sheet (e.g. Receivables detail).
   - Notes/schedules MUST NOT override year column mapping determined from the main Balance Sheet.
   - Output only data rows with numeric amounts. Do not output headings unless they carry a numeric amount.
   - Include subtotals if they carry numeric amounts.

9) Output bs_extract as: { prior_year_label, current_year_label, rows: [...] }
   Each row: { line_item, section, fund, prior_year, current_year }
   - section: OWNERS_EQUITY | ASSETS | LIABILITIES
   - fund: Admin | Capital | Sinking | TOTAL | N/A as shown

========================
E) YEAR COLUMN MAPPING (NO GUESSING)
========================

10) Determine year column mapping from the MAIN Balance Sheet table FIRST (MANDATORY ORDER):
    Step E1: Find the Balance Sheet table block and its column headers.
    Step E2: Determine which column is current_year and which is prior_year using the priority rules below.
    Step E3: LOCK the mapping. After locking, apply to all BS rows and any schedules. Do not re-map.

11) Mapping priority rules (MANDATORY):

    RULE E-PRIMARY (DATE MATCH):
    - If BOTH comparative columns have explicit dates in the column headers (YYYY or DD/MM/YYYY):
      - Map the column whose date matches the current FY end (from intake_summary.financial_year) to current_year.
      - Map the column whose date matches the prior FY end to prior_year.

    RULE E-SECONDARY (LABEL MATCH):
    - If column headers have wording (no dates) such as:
      - current candidates: "Current", "Current Year", "Current period", "This year", "This period"
      - prior candidates: "Prior", "Prior Year", "Previous year", "Comparative", "Comparative Year", "Prior period"
    - Bind labels to numeric columns by table structure: A label belongs to the numeric column directly beneath it in the SAME table block. Do not use page-level text order.
    - If left/right binding is ambiguous after this, DEFAULT: LEFT column = current_year, RIGHT column = prior_year.

    RULE E-TERTIARY (SINGLE COLUMN):
    - If Balance Sheet has ONE numeric column only: Treat it as current_year. Set prior_year = 0 for all rows. Set prior_year_label = "".

12) Ambiguity handling (HARD STOP):
    - If mapping cannot be determined using E-PRIMARY or E-SECONDARY and it is not E-TERTIARY:
      - Set intake_summary.boundary_defined = true
      - Still output document_register and core_data_positions
      - For bs_extract: output rows = [] and labels = ""
      - Do NOT guess left/right.

========================
F) ROW EXTRACTION RULES (APPLY AFTER MAPPING)
========================

13) For each Balance Sheet data row:
    - Extract line_item exactly as displayed.
    - Determine section and fund as shown.
    - Extract both values using the locked year mapping.
    - Normalize numbers: Convert brackets to negative first. Store prior_year and current_year as signed numbers as presented. Do not flip signs unless the Balance Sheet itself shows sign conventions.

14) Receivable and levy blank handling (MANDATORY):
    - For Levies in Arrears, Levies in Advance, and any line_item containing "Receivable" or "Levy":
      - If the current_year cell is blank or shows "-", set current_year = 0.
      - Do NOT substitute from prior_year.

========================
G) SANITY CHECKS (OPTIONAL BUT RECOMMENDED)
========================

15) If the Balance Sheet shows totals (Total Assets, Total Liabilities, Total Equity):
    - Perform a consistency check for current_year: Total Assets ≈ Total Liabilities + Total Equity within tolerance 1.00
    - If it fails, set intake_summary.bs_extract_warning = "balance_check_failed".
    - Do NOT auto-swap columns. Do not guess.

END STEP 0
`;
