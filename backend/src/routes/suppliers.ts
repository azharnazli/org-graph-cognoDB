import { Router } from "express";
import type { Paginated, Supplier, SupplierDetail } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";

export const suppliersRouter = Router();

suppliersRouter.get("/suppliers", async (req, res, next) => {
  try {
    const { skip, limit, page } = parsePagination(req.query["page"], req.query["pageSize"]);
    const { sortField, order } = parseSorting(
      "suppliers",
      req.query["sort"],
      req.query["order"],
      "name",
    );

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (s:Supplier)
         RETURN s { .id, .name, .rating } AS s
         ORDER BY s.${sortField} ${order}
         SKIP $skip LIMIT $limit`,
        { skip, limit },
      );
      const totalResult = await session.run("MATCH (s:Supplier) RETURN count(s) AS total");
      const total = totalResult.records[0]?.get("total") ?? 0;

      const data: Supplier[] = result.records.map((rec) => rec.get("s"));
      res.json({ data, page, pageSize: limit, total } satisfies Paginated<Supplier>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

suppliersRouter.get("/suppliers/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (s:Supplier {id: $id})
         OPTIONAL MATCH (s)-[:LOCATED_IN]->(l:Location)
         WITH s, l
         OPTIONAL MATCH (p:Product)-[:SUPPLIED_BY]->(s)
         WITH s, l, collect(DISTINCT p { .id, .sku, .name, .category }) AS products
         RETURN s {
           .id, .name, .rating,
           location: l { .id, .city, .country, .region },
           products: products
         } AS detail`,
        { id },
      );

      const detail = result.records[0]?.get("detail");
      if (!detail) {
        res.status(404).json({ error: "NotFound", message: "Supplier not found" });
        return;
      }
      res.json({ data: detail as SupplierDetail });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
