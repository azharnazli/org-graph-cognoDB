import { Router } from "express";
import type { HealthResponse } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let database: HealthResponse["database"] = "unreachable";
  let nodeCount = 0;
  try {
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run("MATCH (n) RETURN count(n) AS total");
      nodeCount = result.records[0]?.get("total") ?? 0;
      database = "connected";
    } finally {
      await session.close();
    }
  } catch {
    database = "unreachable";
  }

  const body: HealthResponse = {
    status: "ok",
    database,
    nodeCount,
  };
  res.json(body);
});
