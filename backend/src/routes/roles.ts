import { Router } from "express";
import type { Role } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";

export const rolesRouter = Router();

rolesRouter.get("/roles", async (_req, res, next) => {
  try {
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (r:Role)
         RETURN r { .id, .level } AS r
         ORDER BY r.level`,
      );
      const data: Role[] = result.records.map((rec) => rec.get("r"));
      res.json({ data });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
