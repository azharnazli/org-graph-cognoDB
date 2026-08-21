import { Router } from "express";
import type {
  Paginated,
  Product,
  ProductDetail,
  CreateProductInput,
  UpdateProductInput,
  MutationResult,
} from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";
import { validateCreateProduct, validateUpdateProduct } from "../lib/validate.js";

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

productsRouter.post("/products", async (req, res, next) => {
  try {
    const input = req.body as CreateProductInput;
    const v = validateCreateProduct(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const id = input.id?.trim() || `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const result = await session.run(
        `CREATE (p:Product {id: $id, sku: $sku, name: $name, category: $category})
         RETURN p { .id, .sku, .name, .category } AS product`,
        { id, sku: input.sku, name: input.name, category: input.category },
      );
      const product = result.records[0]?.get("product") as Product | undefined;
      if (!product) {
        res.status(500).json({ error: "InternalServerError", message: "Create failed" });
        return;
      }
      res.status(201).json({ data: product } satisfies MutationResult<Product>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

productsRouter.put("/products/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const input = req.body as UpdateProductInput;
    const v = validateUpdateProduct(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (p:Product {id: $id})
         SET p.name = coalesce($name, p.name),
             p.sku = coalesce($sku, p.sku),
             p.category = coalesce($category, p.category)
         RETURN p { .id, .sku, .name, .category } AS product`,
        { id, name: input.name ?? null, sku: input.sku ?? null, category: input.category ?? null },
      );
      const product = result.records[0]?.get("product") as Product | undefined;
      if (!product) {
        res.status(404).json({ error: "NotFound", message: "Product not found" });
        return;
      }
      res.json({ data: product } satisfies MutationResult<Product>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

productsRouter.delete("/products/:id", async (req, res, next) => {
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
         DETACH DELETE p
         RETURN count(p) AS deleted`,
        { id },
      );
      const deleted = (result.records[0]?.get("deleted")?.toNumber?.() ?? 0) > 0;
      if (!deleted) {
        res.status(404).json({ error: "NotFound", message: "Product not found" });
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
