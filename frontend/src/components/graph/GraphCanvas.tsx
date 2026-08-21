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

const HIT_RADIUS = 14;

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

  // The simulation mutates node objects in place — once it's run, each node
  // has live `x`, `y`, `vx`, `vy`. We need the SAME object references for
  // custom hit detection below, since the React-side `nodes` prop never
  // receives those updates. A ref to graphData captures the mutated copies.
  const graphDataRef = useRef(graphData);
  graphDataRef.current = graphData;

  // Captured each frame from the canvas 2D context's transform. The library
  // applies pan/zoom via `ctx.setTransform(...)` during draw, so we have to
  // grab it from the rendered frame to invert it for screen→graph coords.
  const ctxTransformRef = useRef<DOMMatrix | null>(null);

  // Retune the d3 forces once the engine is up. The defaults are tuned for
  // a quick, dense packing — which produces overlapping nodes that this
  // library cannot reliably hit-test (its shadow-canvas detection eats
  // clicks where hit circles overlap).
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    // 1. Kill the centre force. The default strength=1 drags every node
    //    toward the geometric middle, fighting the charge force and
    //    packing things into the centre. Weakening it lets nodes breathe.
    const center = fg.d3Force("center");
    if (center && "strength" in center) {
      (center as unknown as { strength: (n: number) => unknown }).strength(0.05);
    }
    // 2. Stronger charge so nodes push apart harder.
    const charge = fg.d3Force("charge");
    if (charge && "strength" in charge) {
      (charge as unknown as { strength: (n: number) => unknown }).strength(-700);
    }
    // 3. Generous collide radius. nodeRelSize=6 → visible radius ~6px, so
    //    50px of collision space leaves ~38px between visible edges — far
    //    more than the hit-circle overlap that causes click swallowing.
    const collide = fg.d3Force("collide");
    if (collide && "radius" in collide) {
      (collide as unknown as { radius: (n: number) => unknown }).radius(50);
    }
    // 4. Longer link distance so neighbours don't pull each other back
    //    into the same cluster.
    const link = fg.d3Force("link");
    if (link && "distance" in link) {
      (link as unknown as { distance: (n: number) => unknown }).distance(90);
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

  // Shared click handler — invoked by our custom canvas-level click handler
  // below. Resolves which behaviour to take (inspect-only vs navigate) based
  // on the `onNodeClick` prop.
  const handleNode = useCallback(
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

  // Custom click handler. The library's shadow-canvas hit detection has a
  // long-standing bug: when two hit circles overlap, the last-painted one
  // wins, silently swallowing clicks meant for the node behind. We bypass
  // it entirely — on a DOM click event, convert screen coords to graph
  // coords using the inverse of the canvas's current transform, then pick
  // the closest node within HIT_RADIUS. This means even an obscured node
  // can still be clicked reliably.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    const onClick = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Apply the inverse of the canvas transform to map screen→graph coords.
      // Identity fallback handles a click that races the first painted frame.
      const m = ctxTransformRef.current ?? new DOMMatrix();
      const inv = m.inverse();
      const graphX = inv.a * screenX + inv.c * screenY + inv.e;
      const graphY = inv.b * screenX + inv.d * screenY + inv.f;

      let closest: GraphNode | null = null;
      let closestDist = Infinity;
      for (const node of graphDataRef.current.nodes) {
        // d3-force mutates x/y onto nodes at runtime; the GraphNode type
        // doesn't declare them, so narrow via intersection.
        const nx = (node as GraphNode & { x?: number }).x;
        const ny = (node as GraphNode & { y?: number }).y;
        if (typeof nx !== "number" || typeof ny !== "number") continue;
        const dx = nx - graphX;
        const dy = ny - graphY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HIT_RADIUS && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }
      if (closest) handleNode(closest);
    };

    canvas.addEventListener("click", onClick);
    return () => canvas.removeEventListener("click", onClick);
  }, [handleNode]);

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

  // Capture the canvas's current transform every frame so the click handler
  // can map screen coords back to graph coords.
  const handleRenderFramePost = useCallback((ctx: CanvasRenderingContext2D) => {
    ctxTransformRef.current = ctx.getTransform();
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
        cooldownTicks={300}
        cooldownTime={8000}
        enableNodeDrag={true}
        {...interactionProps}
        onNodeDrag={handleDrag}
        onNodeDragEnd={handleDragEnd}
        onNodeHover={handleHover}
        onNodeRightClick={handleNodeRightClick}
        onRenderFramePost={handleRenderFramePost}
      />
    </div>
  );
}
