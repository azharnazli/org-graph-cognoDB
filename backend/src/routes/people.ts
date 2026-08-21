import { Router } from "express";
import type {
  Paginated,
  Person,
  PersonDetail,
  CreatePersonInput,
  UpdatePersonInput,
  MutationResult,
} from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";
import { validateCreatePerson, validateUpdatePerson } from "../lib/validate.js";

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

peopleRouter.post("/people", async (req, res, next) => {
  try {
    const input = req.body as CreatePersonInput;
    const v = validateCreatePerson(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const id = input.id?.trim() || `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      const cypher = `
        CREATE (p:Person {id: $id, name: $name, email: $email, title: $title, joinedAt: $joinedAt})
        WITH p
        OPTIONAL MATCH (d:Department {id: $departmentId})
        FOREACH (_ IN CASE WHEN d IS NULL THEN [] ELSE [1] END | MERGE (p)-[:WORKS_IN]->(d))
        WITH p
        OPTIONAL MATCH (r:Role {id: $roleId})
        FOREACH (_ IN CASE WHEN r IS NULL THEN [] ELSE [1] END | MERGE (p)-[:HAS_ROLE]->(r))
        WITH p
        OPTIONAL MATCH (mgr:Person {id: $reportsToId})
        FOREACH (_ IN CASE WHEN mgr IS NULL THEN [] ELSE [1] END | MERGE (p)-[:REPORTS_TO]->(mgr))
        RETURN p { .id, .name, .email, .title, joinedAt: toString(p.joinedAt) } AS person`;

      const result = await session.run(cypher, {
        id,
        name: input.name,
        email: input.email,
        title: input.title,
        joinedAt: input.joinedAt,
        departmentId: input.departmentId ?? null,
        roleId: input.roleId ?? null,
        reportsToId: input.reportsToId ?? null,
      });

      const person = result.records[0]?.get("person") as Person | undefined;
      if (!person) {
        res.status(500).json({ error: "InternalServerError", message: "Create failed" });
        return;
      }
      res.status(201).json({ data: person } satisfies MutationResult<Person>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

peopleRouter.put("/people/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const input = req.body as UpdatePersonInput;
    const v = validateUpdatePerson(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      // Update only the properties the client sent; relationship wiring stays
      // untouched (relationship edits are out of scope of this endpoint).
      const result = await session.run(
        `MATCH (p:Person {id: $id})
         SET p.name = coalesce($name, p.name),
             p.email = coalesce($email, p.email),
             p.title = coalesce($title, p.title),
             p.joinedAt = coalesce($joinedAt, p.joinedAt)
         RETURN p { .id, .name, .email, .title, joinedAt: toString(p.joinedAt) } AS person`,
        {
          id,
          name: input.name ?? null,
          email: input.email ?? null,
          title: input.title ?? null,
          joinedAt: input.joinedAt ?? null,
        },
      );

      const person = result.records[0]?.get("person") as Person | undefined;
      if (!person) {
        res.status(404).json({ error: "NotFound", message: "Person not found" });
        return;
      }
      res.json({ data: person } satisfies MutationResult<Person>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

peopleRouter.delete("/people/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      // DETACH DELETE removes the node + every relationship. Reports/managers
      // pointing at this person get cleaned up; sub-tree reports lose their
      // REPORTS_TO edge (intentional — they remain in the graph unrooted).
      const result = await session.run(
        `MATCH (p:Person {id: $id})
         OPTIONAL MATCH (p)-[outR]-() WHERE type(outR) IN ['WORKS_IN','HAS_ROLE','REPORTS_TO','MANAGES']
         OPTIONAL MATCH ()-[inR]->(p) WHERE type(inR) IN ['REPORTS_TO','MANAGES']
         WITH p, count(DISTINCT outR) AS outCount, count(DISTINCT inR) AS inCount
         DETACH DELETE p
         RETURN outCount, inCount`,
        { id },
      );
      const rec = result.records[0];
      if (!rec) {
        res.status(404).json({ error: "NotFound", message: "Person not found" });
        return;
      }
      res.json({ data: { deleted: true, removedOutgoingRelationships: rec.get("outCount")?.toNumber?.() ?? 0, removedIncomingRelationships: rec.get("inCount")?.toNumber?.() ?? 0 } });
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
