import { Router } from "express";
import type { Paginated, Person, PersonDetail } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";

export const peopleRouter = Router();

peopleRouter.get("/people", async (req, res, next) => {
  try {
    const { skip, limit, page } = parsePagination(req.query["page"], req.query["pageSize"]);
    const { sortField, order } = parseSorting("people", req.query["sort"], req.query["order"], "name");
    const q = String(req.query["q"] ?? "").trim();

    const where = q ? "WHERE toLower(p.name) CONTAINS toLower($q) OR toLower(p.email) CONTAINS toLower($q)" : "";
    const cypher = `
      MATCH (p:Person)
      ${where}
      RETURN p { .id, .name, .email, .title, joinedAt: toString(p.joinedAt) } AS p
      ORDER BY p.${sortField} ${order}
      SKIP $skip LIMIT $limit
    `;
    const countCypher = `MATCH (p:Person) ${where} RETURN count(p) AS total`;

    const session = driver.session({ database: "neo4j" });
    try {
      const params: Record<string, unknown> = { skip, limit };
      if (q) params["q"] = q;

      const result = await session.run(cypher, params);
      const totalResult = await session.run(countCypher, params);
      const total = totalResult.records[0]?.get("total") ?? 0;

      const data: Person[] = result.records.map((rec) => rec.get("p"));
      const body: Paginated<Person> = { data, page, pageSize: limit, total };
      res.json(body);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

peopleRouter.get("/people/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      // Use WITH clauses to separate OPTIONAL MATCH steps — required because
      // mixing multiple OPTIONAL MATCH + collect() inside a single map projection
      // returns null silently on this Cypher version.
      const result = await session.run(
        `MATCH (p:Person {id: $id})
         OPTIONAL MATCH (p)-[:WORKS_IN]->(d:Department)
         OPTIONAL MATCH (p)-[:HAS_ROLE]->(r:Role)
         WITH p, d, r
         OPTIONAL MATCH (p)-[:REPORTS_TO]->(mgr:Person)
         WITH p, d, r, mgr
         OPTIONAL MATCH (sub:Person)-[:REPORTS_TO]->(p)
         WITH p, d, r, mgr, collect(DISTINCT sub { .id, .name, .email, .title, joinedAt: toString(sub.joinedAt) }) AS directReports
         OPTIONAL MATCH (p)-[:MANAGES]->(proj:Project)
         WITH p, d, r, mgr, directReports, collect(DISTINCT proj { .id, .name, .status }) AS projects
         RETURN p {
           .id, .name, .email, .title, joinedAt: toString(p.joinedAt),
           reportsTo: mgr { .id, .name, .email, .title, joinedAt: toString(mgr.joinedAt) },
           directReports: directReports,
           department: d { .id, .name, .costCenter },
           role: r { .id, .level },
           projects: projects
         } AS detail`,
        { id },
      );

      const detail = result.records[0]?.get("detail");
      if (!detail) {
        res.status(404).json({ error: "NotFound", message: "Person not found" });
        return;
      }
      res.json({ data: detail as PersonDetail });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

// Reporting chain (multi-hop traversal — required by spec)
peopleRouter.get("/people/:id/reports-chain", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const to = req.query["to"];
    if (typeof to !== "string") {
      res.status(400).json({ error: "BadRequest", message: "Missing ?to=<id>" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH path = shortestPath((a:Person {id: $fromId})-[:REPORTS_TO*]-(b:Person {id: $toId}))
         RETURN [n IN nodes(path) | n { .id, .name, .title }] AS chain, length(path) AS hops`,
        { fromId: id, toId: to },
      );
      const rec = result.records[0];
      if (!rec) {
        res.json({ data: null, message: "No path found" });
        return;
      }
      res.json({ data: { chain: rec.get("chain"), hops: rec.get("hops") } });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
