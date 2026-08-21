import { Router } from "express";
import { driver } from "../db/driver.js";
import { guardReadOnly } from "../lib/query-guard.js";

export const queryRouter = Router();

// Read-only Cypher execution for the Graph Explorer.
queryRouter.post("/query", async (req, res) => {
  try {
    const cypher = String(req.body?.cypher ?? "");
    const params = (req.body?.params ?? {}) as Record<string, unknown>;

    const guard = guardReadOnly(cypher);
    if (!guard.ok) {
      res.status(400).json({ error: "ForbiddenQuery", message: guard.reason ?? "Forbidden" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(guard.cypher, params);
      const data = result.records.map((rec) => {
        const obj: Record<string, unknown> = {};
        for (const sym of rec.keys) {
          const key = String(sym);
          const value = rec.get(sym);
          obj[key] = value && typeof value === "object" && "toObject" in value
            ? (value as { toObject: () => unknown }).toObject()
            : value;
        }
        return obj;
      });
      res.json({ data, count: data.length });
    } finally {
      await session.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ error: "QueryError", message });
  }
});
