/**
 * Phase 2 – Revenue Cycle (Levy Income).
 * Verify Completeness of Levies and Reconcile with Balance Sheet via Master Table E.
 */

export const PHASE_2_REVENUE_PROMPT = `
PHASE 2 – REVENUE CYCLE (LEVY INCOME)
Objective: Verify Completeness of Levies and Reconcile with Balance Sheet via Master Table E.
1. Locate 'Levies in Arrears' and 'Levies in Advance' in the Balance Sheet.
2. Recompute Total Receipts and compare to Effective Levy Receipts from Bank/GL.
3. For every line item, generate a "note" explaining the source context (e.g., "Prior Year Adjustment", "AGM Motion 3.1", "Calculated"). For every CALCULATED figure, fill "computation" (method and expression) and in "note" state the calculation content.

FINANCIAL YEAR ANCHOR (per Phase 2 rules: FY and rate change from minutes only): Determine this strata plan's financial year (start and end dates) from minutes (see Phase 2 item rules). Anchor your search in the section that appears after the title "Audit Execution Report" and near the strata plan name (scheme name, address, or plan number). Use that FY for all time-based logic.

OLD RATE / NEW RATE LEVIES – QUARTERLY PROPORTION (per Phase 2 rules: Old Rate Levies and New Rate Levies source ONLY from minutes; see levy_old_new_levies_source, levy_old_new_rate): Old Rate Levies and New Rate Levies must be time-apportioned by the plan's financial year. Use the FY identified above to define quarters. Identify from minutes the date the new levy rate was adopted. For each quarter (or part-quarter) in the FY, assign levy to Old Rate or New Rate by proportion (e.g. days or months at old rate vs new rate). For every Old_Levy_* and New_Levy_* value, fill "note" and, if calculated, "computation" explaining: FY used (source: minutes), quarter boundaries, minutes date for rate change, and the proportion applied (e.g. "Q1 100% old; Q2 60% old 40% new; FY from Report header").
`;
