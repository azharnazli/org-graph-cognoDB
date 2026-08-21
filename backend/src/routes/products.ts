import { Router } from "express";
import type { Paginated, Product, ProductDetail } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";

export const productsRouter = Router();

productsRouter.get("/products", async (req, res, next) => {
  try {
    const { skip, limit, page } = parsePagination(req.query["page"], req.query["pageSize"]);
    const { sortField, order } = parseSorting(
      "products",
      req.query["sort"],
      req.query["order"],
      "name",
    );

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (p:Product)
         RETURN p { .id, .sku, .name, .category } AS p
         ORDER BY p.${sortField} ${order}
         SKIP $skip LIMIT $limit`,
        { skip, limit },
      );
      const totalResult = await session.run("MATCH (p:Product) RETURN count(p) AS total");
      const total = totalResult.records[0]?.get("total") ?? 0;

      const data: Product[] = result.records.map((rec) => rec.get("p"));
      res.json({ data, page, pageSize: limit, total } satisfies Paginated<Product>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/products/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (p:Product {id: $id})
         OPTIONAL MATCH (p)-[:SUPPLIED_BY]->(s:Supplier)
         OPTIONAL MATCH (s)-[:LOCATED_IN]->(sl:Location)
         WITH p, collect(DISTINCT s { .id, .name, .rating, location: sl { .id, .city, .country, .region } }) AS suppliers
         OPTIONAL MATCH (proj:Project)-[:USES]->(p)
         WITH p, suppliers, collect(DISTINCT proj { .id, .name, .status }) AS projects
         RETURN p {
           .id, .sku, .name, .category,
           suppliers: suppliers,
           projects: projects
         } AS detail`,
        { id },
      );

      const detail = result.records[0]?.get("detail");
      if (!detail) {
        res.status(404).json({ error: "NotFound", message: "Product not found" });
        return;
      }
      res.json({ data: detail as ProductDetail });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
