import { Router } from "express";
import type {
  Paginated,
  Department,
  DepartmentDetail,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  MutationResult,
} from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";
import { validateCreateDepartment, validateUpdateDepartment } from "../lib/validate.js";

export const departmentsRouter = Router();

departmentsRouter.get("/departments", async (req, res, next) => {
  try {
    const { skip, limit, page } = parsePagination(req.query["page"], req.query["pageSize"]);
    const { sortField, order } = parseSorting(
      "departments",
      req.query["sort"],
      req.query["order"],
      "name",
    );

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (d:Department)
         RETURN d { .id, .name, .costCenter } AS d
         ORDER BY d.${sortField} ${order}
         SKIP $skip LIMIT $limit`,
        { skip, limit },
      );
      const totalResult = await session.run("MATCH (d:Department) RETURN count(d) AS total");
      const total = totalResult.records[0]?.get("total") ?? 0;

      const data: Department[] = result.records.map((rec) => rec.get("d"));
      res.json({ data, page, pageSize: limit, total } satisfies Paginated<Department>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

departmentsRouter.get("/departments/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (d:Department {id: $id})
         OPTIONAL MATCH (d)-[:LOCATED_IN]->(l:Location)
         WITH d, l
         OPTIONAL MATCH (p:Person)-[:WORKS_IN]->(d)
         WITH d, l, collect(DISTINCT p { .id, .name, .email, .title, joinedAt: toString(p.joinedAt) }) AS people
         OPTIONAL MATCH (mgr:Person)-[:MANAGES]->(proj:Project)
         WHERE (mgr)-[:WORKS_IN]->(d)
         WITH d, l, people, collect(DISTINCT proj { .id, .name, .status }) AS projects
         RETURN d {
           .id, .name, .costCenter,
           location: l { .id, .city, .country, .region },
           people: people,
           projects: projects
         } AS detail`,
        { id },
      );

      const detail = result.records[0]?.get("detail");
      if (!detail) {
        res.status(404).json({ error: "NotFound", message: "Department not found" });
        return;
      }
      res.json({ data: detail as DepartmentDetail });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

departmentsRouter.post("/departments", async (req, res, next) => {
  try {
    const input = req.body as CreateDepartmentInput;
    const v = validateCreateDepartment(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const id = input.id?.trim() || `dept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const result = await session.run(
        `CREATE (d:Department {id: $id, name: $name, costCenter: $costCenter})
         WITH d
         OPTIONAL MATCH (l:Location {id: $locationId})
         FOREACH (_ IN CASE WHEN l IS NULL THEN [] ELSE [1] END | MERGE (d)-[:LOCATED_IN]->(l))
         RETURN d { .id, .name, .costCenter } AS department`,
        { id, name: input.name, costCenter: input.costCenter, locationId: input.locationId ?? null },
      );
      const dep = result.records[0]?.get("department") as Department | undefined;
      if (!dep) {
        res.status(500).json({ error: "InternalServerError", message: "Create failed" });
        return;
      }
      res.status(201).json({ data: dep } satisfies MutationResult<Department>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

departmentsRouter.put("/departments/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const input = req.body as UpdateDepartmentInput;
    const v = validateUpdateDepartment(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (d:Department {id: $id})
         SET d.name = coalesce($name, d.name),
             d.costCenter = coalesce($costCenter, d.costCenter)
         RETURN d { .id, .name, .costCenter } AS department`,
        { id, name: input.name ?? null, costCenter: input.costCenter ?? null },
      );
      const dep = result.records[0]?.get("department") as Department | undefined;
      if (!dep) {
        res.status(404).json({ error: "NotFound", message: "Department not found" });
        return;
      }
      res.json({ data: dep } satisfies MutationResult<Department>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

departmentsRouter.delete("/departments/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (d:Department {id: $id})
         DETACH DELETE d
         RETURN count(d) AS deleted`,
        { id },
      );
      const deleted = (result.records[0]?.get("deleted")?.toNumber?.() ?? 0) > 0;
      if (!deleted) {
        res.status(404).json({ error: "NotFound", message: "Department not found" });
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
