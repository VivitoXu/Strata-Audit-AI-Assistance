/**
 * 从 Zod AuditResponseSchema 生成 JSON Schema，写入 functions/auditResponseSchema.json，
 * 供 Cloud Function (Schema Mode) 使用。
 * 运行: npx tsx scripts/generate-audit-schema.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { getAuditResponseJsonSchema } from "../src/audit_outputs/json_schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "functions", "auditResponseSchema.json");
const schema = getAuditResponseJsonSchema();
fs.writeFileSync(outPath, JSON.stringify(schema, null, 2), "utf-8");
console.log("Written:", outPath);
