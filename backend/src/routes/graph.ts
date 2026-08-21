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
    nodeLabels: ["Person", "Department"],
    relTypes: ["REPORTS_TO", "WORKS_IN", "MANAGES"],
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

// Role is a tag-style label (5 fixed values: IC/Mgr/Dir/VP/C-level) shown as
// an inline badge on PersonDetail. It has no detail page, so we filter it from
// graph views to keep every visible node navigable.
const EXCLUDED_LABELS = new Set(["Role"]);

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
  if (EXCLUDED_LABELS.has(String(node.labels?.[0] ?? ""))) return;
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
        // Depth is interpolated below — openCypher doesn't accept a parameter in
        // a variable-length bound — so clamp it to a hard integer in [1, 4]
        // before it touches the query string. Non-numeric or out-of-range input
        // falls back to the default depth of 2.
        const rawDepth = Number(req.query["depth"] ?? 2);
        const depth = Number.isFinite(rawDepth)
          ? Math.min(4, Math.max(1, Math.trunc(rawDepth)))
          : 2;
        if (!nodeId) {
          res.status(400).json({ error: "BadRequest", message: "Missing node id" });
          return;
        }

        const result = await session.run(
          `MATCH (start {id: $nodeId})
           OPTIONAL MATCH path = (start)-[*1..${depth}]-(end)
           WHERE end <> start
           WITH start,
                collect(DISTINCT end) AS others,
                collect(DISTINCT path) AS paths
           RETURN start, others, paths`,
          { nodeId },
        );

        const rec = result.records[0];
        if (!rec) {
          res.status(404).json({ error: "NotFound", message: "Node not found" });
          return;
        }

        const start = rec.get("start");
        const others = (rec.get("others") ?? []) as Array<{ properties: Record<string, unknown>; labels: string[]; identity: unknown }>;
        const paths = (rec.get("paths") ?? []) as Array<{
          segments: Array<{
            start: { properties: Record<string, unknown>; labels: string[]; identity: unknown };
            end: { properties: Record<string, unknown>; labels: string[]; identity: unknown };
            relationship: { type: string };
          }>;
        }>;

        const nodeMap = new Map<string, GraphNode>();
        pushNode(nodeMap, start);
        for (const n of others) {
          if (n && n.properties) pushNode(nodeMap, n);
        }

        const links: GraphLink[] = [];
        for (const p of paths) {
          if (!p) continue;
          for (const seg of p.segments) {
            if (!seg?.start?.properties || !seg?.end?.properties) continue;
            pushNode(nodeMap, seg.start);
            pushNode(nodeMap, seg.end);
            links.push({
              source: nodeIdOf(seg.start),
              target: nodeIdOf(seg.end),
              type: String(seg.relationship.type),
            });
          }
        }

        // Excluded labels (Role) never land in nodeMap, but their relationships
        // still surface in path segments; drop links to endpoints we won't render
        // so the graph never references a node that isn't there.
        const navigable = links.filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target));
        const body: GraphResponse = { view, nodes: Array.from(nodeMap.values()), links: navigable };
        res.json({ data: body });
        return;
      }

      const cfg = VIEWS[view] ?? VIEWS["all"]!;
      let cypher: string;
      if (cfg.nodeLabels.length === 0) {
        cypher = "MATCH (n)-[r]->(m) WHERE NOT n:Role AND NOT m:Role RETURN n, r, m LIMIT 1500";
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
