import { Router } from "express";
import type {
  Paginated,
  Supplier,
  SupplierDetail,
  CreateSupplierInput,
  UpdateSupplierInput,
  MutationResult,
} from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";
import { validateCreateSupplier, validateUpdateSupplier } from "../lib/validate.js";

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

suppliersRouter.post("/suppliers", async (req, res, next) => {
  try {
    const input = req.body as CreateSupplierInput;
    const v = validateCreateSupplier(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const id = input.id?.trim() || `sup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const result = await session.run(
        `CREATE (s:Supplier {id: $id, name: $name, rating: $rating})
         WITH s
         OPTIONAL MATCH (l:Location {id: $locationId})
         FOREACH (_ IN CASE WHEN l IS NULL THEN [] ELSE [1] END | MERGE (s)-[:LOCATED_IN]->(l))
         RETURN s { .id, .name, .rating } AS supplier`,
        { id, name: input.name, rating: input.rating, locationId: input.locationId ?? null },
      );
      const supplier = result.records[0]?.get("supplier") as Supplier | undefined;
      if (!supplier) {
        res.status(500).json({ error: "InternalServerError", message: "Create failed" });
        return;
      }
      res.status(201).json({ data: supplier } satisfies MutationResult<Supplier>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

suppliersRouter.put("/suppliers/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const input = req.body as UpdateSupplierInput;
    const v = validateUpdateSupplier(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (s:Supplier {id: $id})
         SET s.name = coalesce($name, s.name),
             s.rating = coalesce($rating, s.rating)
         RETURN s { .id, .name, .rating } AS supplier`,
        { id, name: input.name ?? null, rating: input.rating ?? null },
      );
      const supplier = result.records[0]?.get("supplier") as Supplier | undefined;
      if (!supplier) {
        res.status(404).json({ error: "NotFound", message: "Supplier not found" });
        return;
      }
      res.json({ data: supplier } satisfies MutationResult<Supplier>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

suppliersRouter.delete("/suppliers/:id", async (req, res, next) => {
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
         DETACH DELETE s
         RETURN count(s) AS deleted`,
        { id },
      );
      const deleted = (result.records[0]?.get("deleted")?.toNumber?.() ?? 0) > 0;
      if (!deleted) {
        res.status(404).json({ error: "NotFound", message: "Supplier not found" });
        return;
      }
      res.json({ data: { deleted: true } });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
