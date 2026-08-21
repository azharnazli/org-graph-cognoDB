import { Router } from "express";
import type {
  Paginated,
  Location,
  LocationDetail,
  Department,
  Supplier,
  CreateLocationInput,
  UpdateLocationInput,
  MutationResult,
} from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";
import { validateCreateLocation, validateUpdateLocation } from "../lib/validate.js";

export const locationsRouter = Router();

locationsRouter.get("/locations", async (req, res, next) => {
  try {
    const { skip, limit, page } = parsePagination(req.query["page"], req.query["pageSize"]);
    const { sortField, order } = parseSorting(
      "locations",
      req.query["sort"],
      req.query["order"],
      "city",
    );

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (l:Location)
         RETURN l { .id, .city, .country, .region } AS l
         ORDER BY l.${sortField} ${order}
         SKIP $skip LIMIT $limit`,
        { skip, limit },
      );
      const totalResult = await session.run("MATCH (l:Location) RETURN count(l) AS total");
      const total = totalResult.records[0]?.get("total") ?? 0;

      const data: Location[] = result.records.map((rec) => rec.get("l"));
      res.json({ data, page, pageSize: limit, total } satisfies Paginated<Location>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

locationsRouter.get("/locations/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (l:Location {id: $id})
         OPTIONAL MATCH (s:Supplier)-[:LOCATED_IN]->(l)
         OPTIONAL MATCH (d:Department)-[:LOCATED_IN]->(l)
         WITH l,
              collect(DISTINCT s { .id, .name, .rating }) AS suppliers,
              collect(DISTINCT d { .id, .name, .costCenter }) AS departments
         RETURN l { .id, .city, .country, .region } AS loc,
                [x IN suppliers WHERE x.id IS NOT NULL] AS suppliers,
                [x IN departments WHERE x.id IS NOT NULL] AS departments`,
        { id },
      );

      const rec = result.records[0];
      if (!rec) {
        res.status(404).json({ error: "NotFound", message: "Location not found" });
        return;
      }

      const data: LocationDetail = {
        ...(rec.get("loc") as Location),
        suppliers: rec.get("suppliers") as Supplier[],
        departments: rec.get("departments") as Department[],
      };
      res.json({ data });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

locationsRouter.post("/locations", async (req, res, next) => {
  try {
    const input = req.body as CreateLocationInput;
    const v = validateCreateLocation(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const id = input.id?.trim() || `loc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const result = await session.run(
        `CREATE (l:Location {id: $id, city: $city, country: $country, region: $region})
         RETURN l { .id, .city, .country, .region } AS location`,
        { id, city: input.city, country: input.country, region: input.region },
      );
      const location = result.records[0]?.get("location") as Location | undefined;
      if (!location) {
        res.status(500).json({ error: "InternalServerError", message: "Create failed" });
        return;
      }
      res.status(201).json({ data: location } satisfies MutationResult<Location>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

locationsRouter.put("/locations/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const input = req.body as UpdateLocationInput;
    const v = validateUpdateLocation(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (l:Location {id: $id})
         SET l.city = coalesce($city, l.city),
             l.country = coalesce($country, l.country),
             l.region = coalesce($region, l.region)
         RETURN l { .id, .city, .country, .region } AS location`,
        { id, city: input.city ?? null, country: input.country ?? null, region: input.region ?? null },
      );
      const location = result.records[0]?.get("location") as Location | undefined;
      if (!location) {
        res.status(404).json({ error: "NotFound", message: "Location not found" });
        return;
      }
      res.json({ data: location } satisfies MutationResult<Location>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

locationsRouter.delete("/locations/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (l:Location {id: $id})
         DETACH DELETE l
         RETURN count(l) AS deleted`,
        { id },
      );
      const deleted = (result.records[0]?.get("deleted")?.toNumber?.() ?? 0) > 0;
      if (!deleted) {
        res.status(404).json({ error: "NotFound", message: "Location not found" });
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
