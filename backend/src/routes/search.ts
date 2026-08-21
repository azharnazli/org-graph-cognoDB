import { Router } from "express";
import { driver } from "../db/driver.js";

export const searchRouter = Router();

interface SearchHit {
  label: string;
  id: string;
  name: string;
}

searchRouter.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query["q"] ?? "").trim();
    if (q.length < 2) {
      res.json({ data: [], query: q });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (n)
         WHERE (n:Person OR n:Department OR n:Project OR n:Product OR n:Supplier OR n:Location)
           AND (
             toLower(coalesce(n.name, "")) CONTAINS toLower($q)
             OR toLower(coalesce(n.sku, "")) CONTAINS toLower($q)
             OR toLower(coalesce(n.city, "")) CONTAINS toLower($q)
             OR toLower(coalesce(n.email, "")) CONTAINS toLower($q)
           )
         RETURN
           labels(n)[0] AS label,
           n.id AS id,
           coalesce(n.name, n.sku, n.city, n.email) AS name
         ORDER BY label, name
         LIMIT 50`,
        { q },
      );

      const data: SearchHit[] = result.records.map((rec) => ({
        label: rec.get("label"),
        id: rec.get("id"),
        name: rec.get("name"),
      }));
      res.json({ data, query: q });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
