/**
 * Phase 6 – Completion & Disclosure.
 * Compile Final Issue Register and Boundary Disclosures.
 */

export const PHASE_6_COMPLETION_PROMPT = `
PHASE 6 – COMPLETION & DISCLOSURE
Objective: Compile Final Issue Register and Boundary Disclosures from audit findings. The LOCKED context contains levy_reconciliation, assets_and_cash, expense_samples, statutory_compliance – use these structured outputs.
- issue_register: Aggregate issues from Phases 2–5 (levy variances, BS gaps, expense risks, compliance findings). Each entry: Issue_ID, Phase, Description, Resolution_Status.
- boundary_disclosure: Document unresolved areas – Area, What_Is_Missing, Why_Unresolved, Required_To_Resolve. Use missing_critical_types, Not Resolved findings, intake_summary.boundary_defined (FY or BS mapping ambiguous), and intake_summary.bs_extract_warning (e.g. balance_check_failed).
`;
