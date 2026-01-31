/**
 * 导出供 Gemini Schema Mode 使用的 JSON Schema（由 Zod AuditResponseSchema 生成）。
 * 使用 Zod 4 原生 toJSONSchema，并去掉 ~standard 等非标准字段，得到纯 JSON Schema 对象。
 */

import { AuditResponseSchema } from "./schema_definitions";

type JsonSchema = Record<string, unknown>;

function toPlainJsonSchema(payload: unknown): JsonSchema {
  const raw = payload as JsonSchema;
  const out = { ...raw };
  delete out["~standard"];
  return out;
}

/**
 * 返回 AuditResponse 的 JSON Schema 对象，用于 Gemini generateContent 的 responseJsonSchema。
 * target draft-07 与 Gemini 文档推荐的 JSON Schema 兼容。
 */
export function getAuditResponseJsonSchema(): JsonSchema {
  const payload = AuditResponseSchema.toJSONSchema({
    target: "draft-07",
  });
  return toPlainJsonSchema(payload);
}
