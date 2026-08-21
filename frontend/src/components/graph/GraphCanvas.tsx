import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, {
  type ForceGraphMethods,
  type ForceGraphProps,
} from "react-force-graph-2d";
import type { GraphNode, GraphLink } from "@/hooks/useGraph";
import { nodeColor, linkColor } from "@/lib/graph-colors";
import { LABEL_TO_PATH } from "@/lib/graph-paths";

const PAPER = "hsl(42, 22%, 96%)";
const INK = "hsl(215, 30%, 12%)";

// Visual node radius — what we actually paint.
const NODE_RADIUS = 7;

// Generous hit area so dragging doesn't require pixel-hunting, and so that
// adjacent nodes don't sit on top of each other so closely that their hit
// circles block each other.
const HIT_RADIUS = 18;

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

  // Once the engine has the simulation built, beef up the collide and charge
  // forces so nodes don't pile on top of each other in dense regions.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Stronger repulsion between nodes (default ~-30 is too weak for our density).
    const charge = fg.d3Force("charge");
    if (charge && "strength" in charge) {
      (charge as unknown as { strength: (n: number) => unknown }).strength(-180);
    }
    // Collision radius larger than visual so nodes never overlap visually.
    const collide = fg.d3Force("collide");
    if (collide && "radius" in collide) {
      (collide as unknown as { radius: (n: number) => unknown }).radius(HIT_RADIUS + 2);
    }
    // Link distance — pull connected nodes further apart.
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
  // shipped d.ts, so carry them through the typed prop surface.
  const opacityProps = useMemo(
    () =>
      ({
        nodeOpacity: (n: GraphNode) =>
          hoverNeighbors === null ? 1 : hoverNeighbors.has(n.id) ? 1 : 0.22,
        linkOpacity: (l: GraphLink) => {
          if (hoverId === null) return 0.85;
          const touches =
            l.source === hoverId ||
            l.target === hoverId ||
            (l.source as unknown as GraphNode)?.id === hoverId ||
            (l.target as unknown as GraphNode)?.id === hoverId;
          return touches ? 1 : 0.15;
        },
      }) as ForceGraphProps<GraphNode, GraphLink>,
    [hoverNeighbors, hoverId],
  );

  const nodePaint = useCallback(
    (raw: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = raw as GraphNode & { x?: number; y?: number };
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const r = NODE_RADIUS;
      const isSelected = n.id === selectedId;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor(n);
      ctx.fill();

      if (isSelected) {
        ctx.lineWidth = 1.5 / globalScale;
        ctx.strokeStyle = INK;
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = PAPER;
        ctx.fillRect(x - r * 0.7, y - 1.5 / globalScale, r * 1.4, 3 / globalScale);
      }

      if (globalScale >= 1.2 || n.id === hoverId) {
        const fontSize = 10 / globalScale;
        ctx.font = `500 ${fontSize}px "IBM Plex Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = INK;
        ctx.fillText(n.name, x, y + r + 3 / globalScale);
      }
    },
    [hoverId, selectedId],
  );

  // react-force-graph-2d only routes pointer events through shapes painted
  // by nodePointerAreaPaint — without an explicit hit area, custom-painted
  // nodes are invisible to clicks/drags. Paint a generous transparent hit
  // circle so grabbing is forgiving.
  const nodePointerArea = useCallback(
    (raw: object, color: string, ctx: CanvasRenderingContext2D) => {
      const n = raw as GraphNode & { x?: number; y?: number };
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, HIT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    },
    [],
  );

  const linkWidthFn = useCallback(
    (l: object) => {
      const link = l as GraphLink;
      const touches =
        link.source === hoverId ||
        link.target === hoverId ||
        (link.source as unknown as GraphNode)?.id === hoverId ||
        (link.target as unknown as GraphNode)?.id === hoverId;
      return touches ? 2.6 : 1.1;
    },
    [hoverId],
  );

  // react-force-graph-2d defaults `onNodeDragEnd` to clearing node.fx/fy,
  // which un-pins the node and lets the simulation snap it back to its
  // computed position — that's why dragged nodes used to spring back. Pin
  // permanently on drop instead.
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

  // Right-click a node to release its drag pin (fx/fy = undefined) so the
  // simulation can re-place it.
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
        backgroundColor={PAPER}
        nodeRelSize={10}
        nodeColor={(n) => nodeColor(n as GraphNode)}
        nodeLabel={(n) => (n as GraphNode).name}
        linkColor={(l) => linkColor(l as GraphLink)}
        linkWidth={linkWidthFn}
        {...opacityProps}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={120}
        cooldownTime={2000}
        d3VelocityDecay={0.85}
        d3AlphaMin={0}
        enableNodeDrag={true}
        onNodeDrag={handleDrag}
        onNodeDragEnd={handleDragEnd}
        onNodeClick={handleClick}
        onNodeHover={handleHover}
        onNodeRightClick={handleNodeRightClick}
        nodeCanvasObject={nodePaint}
        nodePointerAreaPaint={nodePointerArea}
      />
    </div>
  );
}
