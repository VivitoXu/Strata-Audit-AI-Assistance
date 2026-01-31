/**
 * 各 Phase 下具体 item 的细化规则类型（优先级、白名单证据链等）。
 * 用于 rules/phase_*_rules.ts 中定义，并生成注入 system prompt 的指导文本。
 */

/** 单条证据在证据链中的优先级（数字越小越优先） */
export type EvidencePriority = number;

/** 某 item 的规则：证据优先级、白名单文档类型、必选证据等 */
export interface PhaseItemRule {
  /** 证据类型/来源 → 优先级（1=最高），用于排序与指导“优先采纳” */
  evidencePriority?: Record<string, EvidencePriority>;
  /** 白名单：仅接受这些文档类型作为该 item 的有效证据 */
  whitelistDocTypes?: string[];
  /** 必选证据类型（缺一不可） */
  requiredEvidenceTypes?: string[];
  /** 人类可读的指导说明，会注入 prompt */
  guidance?: string;
}

/** Phase 下多个 item 的规则集合，key 为 item 名称（如 receipt, agm_minutes） */
export type PhaseRulesMap = Record<string, PhaseItemRule>;
