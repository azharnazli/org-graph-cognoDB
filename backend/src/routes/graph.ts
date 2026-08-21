import { Router } from "express";
import { driver } from "../db/driver.js";

export const graphRouter = Router();

interface GraphNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, unknown>;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphResponse {
  view: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

const VIEWS: Record<string, { nodeLabels: string[]; relTypes: string[] }> = {
  org: {
    nodeLabels: ["Person", "Department", "Role"],
    relTypes: ["REPORTS_TO", "WORKS_IN", "HAS_ROLE", "MANAGES"],
  },
  supply: {
    nodeLabels: ["Project", "Product", "Supplier", "Location", "Department"],
    relTypes: ["USES", "SUPPLIED_BY", "LOCATED_IN"],
  },
  all: {
    nodeLabels: [],
    relTypes: [],
  },
};

function buildNode(node: { properties: Record<string, unknown>; labels: string[]; identity: unknown }): GraphNode {
  const id = String(node.properties["id"] ?? node.identity);
  const label = String(node.labels[0] ?? "Node");
  const name = String(
    node.properties["name"] ??
      node.properties["title"] ??
      node.properties["city"] ??
      node.properties["sku"] ??
      node.properties["level"] ??
      id,
  );
  return { id, label, name, properties: node.properties };
}

function pushNode(map: Map<string, GraphNode>, node: { properties: Record<string, unknown>; labels: string[]; identity: unknown }): void {
  const id = String(node.properties["id"] ?? node.identity);
  if (!map.has(id)) {
    map.set(id, buildNode(node));
  }
}

function nodeIdOf(node: { properties: Record<string, unknown>; identity: unknown }): string {
  return String(node.properties["id"] ?? node.identity);
}

graphRouter.get("/graph", async (req, res, next) => {
  try {
    const view = String(req.query["view"] ?? "all");
    const session = driver.session({ database: "neo4j" });
    try {
      if (view === "neighborhood") {
        const nodeId = String(req.query["node"] ?? "");
        const depth = Math.min(4, Math.max(1, Number(req.query["depth"] ?? 2)));
        if (!nodeId) {
          res.status(400).json({ error: "BadRequest", message: "Missing node id" });
          return;
        }

        const result = await session.run(
          `MATCH (start {id: $nodeId})
           OPTIONAL MATCH (start)-[r1]-(n1)
           WITH start, collect(DISTINCT n1) AS depth1, collect(DISTINCT r1) AS rels1
           OPTIONAL MATCH path = (start)-[*2..${depth}]-(n2)
           WHERE n2 <> start AND NOT n2 IN depth1
           WITH start, depth1, rels1,
                collect(DISTINCT n2) AS depth2,
                reduce(acc = [], p IN collect(path) | acc + relationships(p)) AS pathRels
           RETURN start, depth1, depth2, rels1 + pathRels AS rels`,
          { nodeId },
        );

        const rec = result.records[0];
        if (!rec) {
          res.status(404).json({ error: "NotFound", message: "Node not found" });
          return;
        }

        const start = rec.get("start");
        const depth1 = (rec.get("depth1") ?? []) as Array<{ properties: Record<string, unknown>; labels: string[]; identity: unknown }>;
        const depth2 = (rec.get("depth2") ?? []) as Array<{ properties: Record<string, unknown>; labels: string[]; identity: unknown }>;
        const rels = (rec.get("rels") ?? []) as Array<{ start: unknown; end: unknown; type: string }>;

        const nodeMap = new Map<string, GraphNode>();
        pushNode(nodeMap, start);
        for (const n of [...depth1, ...depth2]) {
          if (n && n.properties) pushNode(nodeMap, n);
        }

        const links: GraphLink[] = [];
        for (const r of rels) {
          if (!r) continue;
          links.push({
            source: String((r.start as { properties?: Record<string, unknown>; identity: unknown }).properties?.["id"] ?? (r.start as { identity: unknown }).identity),
            target: String((r.end as { properties?: Record<string, unknown>; identity: unknown }).properties?.["id"] ?? (r.end as { identity: unknown }).identity),
            type: String(r.type),
          });
        }

        const body: GraphResponse = { view, nodes: Array.from(nodeMap.values()), links };
        res.json({ data: body });
        return;
      }

      const cfg = VIEWS[view] ?? VIEWS["all"]!;
      let cypher: string;
      if (cfg.nodeLabels.length === 0) {
        cypher = "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 1500";
      } else {
        const labels = cfg.nodeLabels.map((l) => `n:${l}`).join(" OR ");
        const labelsM = cfg.nodeLabels.map((l) => `m:${l}`).join(" OR ");
        const types = cfg.relTypes.map((t) => `'${t}'`).join(", ");
        cypher = `MATCH (n)-[r]->(m)
                  WHERE (${labels}) AND (${labelsM}) AND type(r) IN [${types}]
                  RETURN n, r, m LIMIT 1500`;
      }

      const result = await session.run(cypher);

      const nodeMap = new Map<string, GraphNode>();
      const links: GraphLink[] = [];

      for (const rec of result.records) {
        const n = rec.get("n");
        const m = rec.get("m");
        const r = rec.get("r");

        pushNode(nodeMap, n);
        pushNode(nodeMap, m);

        links.push({
          source: nodeIdOf(n),
          target: nodeIdOf(m),
          type: String(r.type),
        });
      }

      const body: GraphResponse = {
        view,
        nodes: Array.from(nodeMap.values()),
        links,
      };
      res.json({ data: body });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
