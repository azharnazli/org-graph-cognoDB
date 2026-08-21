import { Router } from "express";
import type { Paginated, Department, DepartmentDetail } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";

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
