/**
 * Merge ai_attempt_updates (targeted re-verification result) into existing audit result.
 */

import type {
  AuditResponse,
  LevyReconciliation,
  ExpenseSample,
  BalanceSheetVerificationItem,
  StatutoryCompliance,
} from "../src/audit_outputs/type_definitions";

export interface AiAttemptUpdates {
  levy_reconciliation?: LevyReconciliation | null;
  expense_updates?: Array<{ merge_key: string; item: ExpenseSample }> | null;
  balance_sheet_updates?: BalanceSheetVerificationItem[] | null;
  statutory_compliance?: Partial<StatutoryCompliance> | null;
}

export function mergeAiAttemptUpdates(
  current: AuditResponse,
  updates: AiAttemptUpdates | null | undefined
): AuditResponse {
  if (!updates) return current;
  const result = { ...current };

  if (updates.levy_reconciliation != null) {
    result.levy_reconciliation = updates.levy_reconciliation;
  }

  if (updates.expense_updates?.length && result.expense_samples) {
    const samples = [...result.expense_samples];
    for (const u of updates.expense_updates) {
      const match = u.merge_key.match(/^exp_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx >= 0 && idx < samples.length) {
          samples[idx] = u.item;
        }
      }
    }
    result.expense_samples = samples;
  }

  if (updates.balance_sheet_updates?.length && result.assets_and_cash?.balance_sheet_verification) {
    const verif = [...result.assets_and_cash.balance_sheet_verification];
    const key = (b: BalanceSheetVerificationItem) => `${b.line_item || ""}|${b.fund || "N/A"}`;
    const updateMap = new Map(updates.balance_sheet_updates.map((b) => [key(b), b]));
    for (let i = 0; i < verif.length; i++) {
      const k = key(verif[i]);
      const u = updateMap.get(k);
      if (u) verif[i] = u;
    }
    result.assets_and_cash = {
      ...result.assets_and_cash,
      balance_sheet_verification: verif,
    };
  }

  if (updates.statutory_compliance != null && Object.keys(updates.statutory_compliance).length > 0) {
    result.statutory_compliance = {
      ...result.statutory_compliance,
      ...updates.statutory_compliance,
    } as StatutoryCompliance;
  }

  return result;
}
