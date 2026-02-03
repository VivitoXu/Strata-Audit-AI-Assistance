/**
 * Call 2 – Phase-specific prompts for Levy, Phase4 (BS Verification), Expenses.
 * Each runs with Step 0 output as LOCKED context (injected in userInstruction).
 */

import { HIERARCHY_INTRO, HIERARCHY_AFTER_EVIDENCE } from "./kernel/00_constitution";
import { EVIDENCE_RULES_PROMPT } from "./kernel/20_evidence_rules";
import { PHASE_2_RULES_PROMPT, PHASE_4_RULES_PROMPT } from "./rules";
import { PHASE_2_REVENUE_PROMPT } from "./workflow/phase_2_revenue";
import { PHASE_4_ASSETS_PROMPT } from "./workflow/phase_4_assets";
import { PHASE_3_EXPENSES_PROMPT, EXPENSE_RISK_FRAMEWORK, PHASE_3_FUND_INTEGRITY } from "./workflow/phase_3_expenses";
import { PHASE_5_COMPLIANCE_PROMPT } from "./workflow/phase_5_compliance";
import { PHASE_6_COMPLETION_PROMPT } from "./workflow/phase_6_completion";
import { PHASE_AI_ATTEMPT_PROMPT } from "./workflow/phase_ai_attempt";
import { MODULE_50_OUTPUTS_PROMPT } from "../audit_outputs/output_registry";

const LOCKED_CONTEXT_INSTRUCTION = `
--- CALL 2 – LOCKED STEP 0 CONTEXT ---
The user message will contain LOCKED STEP 0 OUTPUT. You MUST use it. Do NOT re-extract document_register or intake_summary.
Use core_data_positions for document/page locations. Use intake_summary.financial_year as the global FY. Use bs_extract as the sole source for Balance Sheet data – PriorYear_*/CurrentYear_* (Phase 2) and bs_amount (Phase 4) MUST be looked up from bs_extract.
`;

/** Levy-only output: return levy_reconciliation */
const LEVY_OUTPUT_SCHEMA = `
--- OUTPUT: Return ONLY levy_reconciliation ---
You must return a JSON object with a single key "levy_reconciliation" containing master_table and high_risk_debtors.
See MODULE 50 for the full levy_reconciliation structure. Apply all Phase 2 formulas and sourcing rules.
`;

/** Phase 4 only output: return assets_and_cash */
const PHASE4_OUTPUT_SCHEMA = `
--- OUTPUT: Return ONLY assets_and_cash ---
You must return a JSON object with a single key "assets_and_cash" containing balance_sheet_verification array.
See MODULE 50 for the full assets_and_cash structure. Apply Phase 4 rules R1–R5 strictly. supporting_amount per R2–R5.
`;

/** Expenses-only output: return expense_samples (Phase 3 v2 risk-based structure) */
const EXPENSES_OUTPUT_SCHEMA = `
--- OUTPUT: Return ONLY expense_samples ---
You must return a JSON object with a single key "expense_samples" containing an array of expense items.
Each item MUST include: GL_ID, GL_Date, GL_Payee, GL_Amount, Risk_Profile, Three_Way_Match, Fund_Integrity, Overall_Status.
See MODULE 50 for the full expense_samples (Phase 3 v2) structure. Apply EXPENSE_RISK_FRAMEWORK: Target Sample List from Step A, then Step B (Three-Way Match) and Step C (Fund Integrity) per item.
`;

/** Phase 5 only output: return statutory_compliance */
const PHASE5_OUTPUT_SCHEMA = `
--- OUTPUT: Return ONLY statutory_compliance ---
You must return a JSON object with a single key "statutory_compliance" containing { insurance, gst_reconciliation, income_tax }.
See MODULE 50 for the full statutory_compliance structure. Insurance adequacy, GST roll-forward, Income Tax.
`;

/** Phase 6 only output: return completion_outputs */
const PHASE6_OUTPUT_SCHEMA = `
--- OUTPUT: Return ONLY completion_outputs ---
You must return a JSON object with a single key "completion_outputs" containing { issue_register, boundary_disclosure }.
See MODULE 50 for the full completion_outputs structure. Aggregate issues from audit findings; document unresolved areas.
`;

export function buildPhase5Prompt(): string {
  return (
    HIERARCHY_INTRO +
    EVIDENCE_RULES_PROMPT +
    HIERARCHY_AFTER_EVIDENCE +
    LOCKED_CONTEXT_INSTRUCTION +
    PHASE_5_COMPLIANCE_PROMPT +
    MODULE_50_OUTPUTS_PROMPT +
    PHASE5_OUTPUT_SCHEMA
  );
}

/** AI Attempt output: return ai_attempt_updates (partial patch to merge) */
const AI_ATTEMPT_OUTPUT_SCHEMA = `
--- OUTPUT: Return ONLY ai_attempt_updates ---
You must return a JSON object with a single key "ai_attempt_updates" containing the re-verified items:
{
  "ai_attempt_updates": {
    "levy_reconciliation": { ... } | null,
    "expense_updates": [ { "merge_key": "exp_0", "item": { GL_ID, GL_Date, GL_Payee, GL_Amount, Three_Way_Match, Fund_Integrity, Overall_Status, ... } } ] | null,
    "balance_sheet_updates": [ { "line_item": "String", "fund": "String", ...BalanceSheetVerificationItem } ] | null,
    "statutory_compliance": { insurance?, gst_reconciliation?, income_tax? } | null
  }
}
- For each target phase, include ONLY the re-verified items. Omit phases with no targets.
- expense_updates: merge_key = exp_N (N = index in original expense_samples). Include full item.
- balance_sheet_updates: include line_item, fund, section for merge; full BalanceSheetVerificationItem.
- levy_reconciliation / statutory_compliance: full object if any target in that phase.
`;

export function buildAiAttemptPrompt(targets: { phase: string; itemId: string; description: string }[]): string {
  const targetsText = targets.length === 0
    ? "(No targets – return empty ai_attempt_updates)"
    : targets.map((t) => `- ${t.phase}: ${t.itemId} – ${t.description}`).join("\n");
  const targetsBlock = `
--- TARGET LIST (re-verify ONLY these) ---
${targetsText}
`;
  return (
    HIERARCHY_INTRO +
    EVIDENCE_RULES_PROMPT +
    HIERARCHY_AFTER_EVIDENCE +
    LOCKED_CONTEXT_INSTRUCTION +
    PHASE_AI_ATTEMPT_PROMPT +
    targetsBlock +
    MODULE_50_OUTPUTS_PROMPT +
    AI_ATTEMPT_OUTPUT_SCHEMA
  );
}

export function buildPhase6Prompt(): string {
  return (
    HIERARCHY_INTRO +
    EVIDENCE_RULES_PROMPT +
    HIERARCHY_AFTER_EVIDENCE +
    LOCKED_CONTEXT_INSTRUCTION +
    PHASE_6_COMPLETION_PROMPT +
    MODULE_50_OUTPUTS_PROMPT +
    PHASE6_OUTPUT_SCHEMA
  );
}

export function buildLevyPrompt(): string {
  return (
    HIERARCHY_INTRO +
    EVIDENCE_RULES_PROMPT +
    HIERARCHY_AFTER_EVIDENCE +
    LOCKED_CONTEXT_INSTRUCTION +
    PHASE_2_REVENUE_PROMPT +
    PHASE_2_RULES_PROMPT +
    MODULE_50_OUTPUTS_PROMPT +
    LEVY_OUTPUT_SCHEMA
  );
}

export function buildPhase4Prompt(): string {
  return (
    HIERARCHY_INTRO +
    EVIDENCE_RULES_PROMPT +
    HIERARCHY_AFTER_EVIDENCE +
    LOCKED_CONTEXT_INSTRUCTION +
    PHASE_4_ASSETS_PROMPT +
    PHASE_4_RULES_PROMPT +
    MODULE_50_OUTPUTS_PROMPT +
    PHASE4_OUTPUT_SCHEMA
  );
}

export function buildExpensesPrompt(): string {
  return (
    HIERARCHY_INTRO +
    EVIDENCE_RULES_PROMPT +
    HIERARCHY_AFTER_EVIDENCE +
    LOCKED_CONTEXT_INSTRUCTION +
    EXPENSE_RISK_FRAMEWORK +
    PHASE_3_FUND_INTEGRITY +
    PHASE_3_EXPENSES_PROMPT +
    MODULE_50_OUTPUTS_PROMPT +
    EXPENSES_OUTPUT_SCHEMA
  );
}
