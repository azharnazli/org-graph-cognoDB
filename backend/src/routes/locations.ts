import { Router } from "express";
import type { Paginated, Location } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";

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
