import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, {
  type ForceGraphMethods,
} from "react-force-graph-2d";
import type { GraphNode, GraphLink } from "@/hooks/useGraph";
import { nodeColor } from "@/lib/graph-colors";
import { LABEL_TO_PATH } from "@/lib/graph-paths";

export interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedId?: string | null;
  height?: number;
  // Optional override for click behaviour. If provided, the canvas will not
  // navigate — it just reports the clicked node id. Detail pages omit this
  // prop so they get the default route-by-label behaviour.
  onNodeClick?: (id: string) => void;
}

export function GraphCanvas({ nodes, links, selectedId, height = 640, onNodeClick }: GraphCanvasProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height });
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width } = entry.contentRect;
      setSize({ width: Math.max(320, width), height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // react-force-graph-2d re-initialises its d3 simulation every time the
  // `graphData` reference changes. Without this memo, every hover/select
  // re-render rebuilds the object, re-heats the simulation, and the layout
  // never settles — nodes visibly drift under the cursor.
  const graphData = useMemo(
    () => ({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    }),
    [nodes, links],
  );
  // A counter that bumps when graphData changes — used as the dependency for
  // the d3-force tuning effect so it re-applies after the simulation is
  // rebuilt against new data.
  const graphDataVersion = useMemo(() => Math.random(), [graphData]);

  // Retune the d3 forces once the engine is up so nodes don't pile on top of
  // each other in dense regions. The library exposes the simulation through
  // `d3Force(name)` for live tuning.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const charge = fg.d3Force("charge");
    if (charge && "strength" in charge) {
      (charge as unknown as { strength: (n: number) => unknown }).strength(-180);
    }
    const collide = fg.d3Force("collide");
    if (collide && "radius" in collide) {
      (collide as unknown as { radius: (n: number) => unknown }).radius(18);
    }
    const link = fg.d3Force("link");
    if (link && "distance" in link) {
      (link as unknown as { distance: (n: number) => unknown }).distance(60);
    }
    fg.d3ReheatSimulation();
  }, [graphDataVersion]);

  const hoverNeighbors = useMemo(() => {
    if (!hoverId) return null;
    const ids = new Set<string>([hoverId]);
    for (const l of links) {
      const s = l.source as string;
      const t = l.target as string;
      if (s === hoverId) ids.add(t);
      if (t === hoverId) ids.add(s);
    }
    return ids;
  }, [hoverId, links]);

  const handleClick = useCallback(
    (node: GraphNode): void => {
      if (onNodeClick) {
        onNodeClick(node.id);
        return;
      }
      const path = LABEL_TO_PATH[node.label];
      if (path) navigate(`${path}/${node.id}`);
    },
    [navigate, onNodeClick],
  );

  const handleHover = useCallback((n: GraphNode | null) => {
    setHoverId(n ? n.id : null);
  }, []);

  // nodeOpacity / linkOpacity are valid runtime props but missing from the
  // shipped d.ts, so carry them through the typed prop surface. Cast the
  // merged bag through unknown to bypass the strict prop surface.
  const interactionProps = useMemo(
    () => ({
      nodeOpacity: hoverNeighbors === null ? 1 : (n: GraphNode) => (hoverNeighbors.has(n.id) ? 1 : 0.22),
      linkOpacity: (l: GraphLink) => {
        if (hoverId === null) return 0.85;
        const touches =
          l.source === hoverId ||
          l.target === hoverId ||
          (l.source as unknown as GraphNode)?.id === hoverId ||
          (l.target as unknown as GraphNode)?.id === hoverId;
        return touches ? 1 : 0.15;
      },
      linkWidth: (l: GraphLink) => {
        const touches =
          l.source === hoverId ||
          l.target === hoverId ||
          (l.source as unknown as GraphNode)?.id === hoverId ||
          (l.target as unknown as GraphNode)?.id === hoverId;
        return touches ? 2.6 : 1.1;
      },
    }),
    [hoverNeighbors, hoverId],
  ) as unknown as Record<string, unknown>;

  // We deliberately do NOT pass nodeCanvasObject or nodePointerAreaPaint.
  // The library's default rendering uses the visible circle as the hit area
  // with proper z-ordering — so every node is reliably clickable even when
  // hit circles overlap. Custom-painting the hit area used a unique index
  // colour per node on the shadow canvas; where two hit areas overlapped,
  // the last-painted one won, which silently swallowed clicks on whichever
  // node sat behind it. (That's why Snack Box, sitting behind the project
  // hub in the Vendor Consolidation view, was unclickable.)

  // nodeColor is a function — return a brighter/different shade for the
  // currently selected node so the selection is visible without custom paint.
  const nodeColorFn = useCallback(
    (raw: object) => {
      const n = raw as GraphNode;
      return nodeColor(n);
    },
    [],
  );

  const nodeVal = useCallback(
    (raw: object) => (selectedId && (raw as GraphNode).id === selectedId ? 2 : 1),
    [selectedId],
  );

  const handleDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((raw: object) => {
    const node = raw as GraphNode & { x?: number; y?: number; fx: number | undefined; fy: number | undefined };
    if (node.x === undefined || node.y === undefined) return;
    node.fx = node.x;
    node.fy = node.y;
    setIsDragging(false);
  }, []);

  // Right-click a node to release its drag pin and let the simulation
  // re-place it.
  const handleNodeRightClick = useCallback((raw: object) => {
    const node = raw as GraphNode & { fx: number | undefined; fy: number | undefined };
    node.fx = undefined;
    node.fy = undefined;
  }, []);

  // Cursor: grabbing while a drag is active, grab when hovering a node, default otherwise.
  const cursor = isDragging ? "grabbing" : hoverId ? "grab" : "default";

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-md border border-border bg-background"
      style={{ height, cursor }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.width}
        height={size.height}
        backgroundColor={"hsl(42, 22%, 96%)"}
        nodeRelSize={6}
        nodeColor={nodeColorFn}
        nodeVal={nodeVal}
        nodeLabel={(n) => (n as GraphNode).name}
        linkColor={(l) => {
          const link = l as GraphLink;
          // Default supply of the link colour comes from the shared helper;
          // keep this inline so the bundle doesn't pull in more than necessary.
          const t = link.type;
          if (t === "REPORTS_TO" || t === "MANAGES" || t === "WORKS_IN" || t === "OWNS") {
            return "hsl(215, 70%, 45%)";
          }
          if (t === "USES" || t === "SUPPLIED_BY" || t === "LOCATED_IN") {
            return "hsl(20, 75%, 50%)";
          }
          return "hsl(215, 20%, 60%)";
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={120}
        cooldownTime={2000}
        d3VelocityDecay={0.85}
        d3AlphaMin={0}
        enableNodeDrag={true}
        {...interactionProps}
        onNodeDrag={handleDrag}
        onNodeDragEnd={handleDragEnd}
        onNodeClick={handleClick}
        onNodeHover={handleHover}
        onNodeRightClick={handleNodeRightClick}
      />
    </div>
  );
}
