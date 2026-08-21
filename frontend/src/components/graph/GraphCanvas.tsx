import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, {
  type ForceGraphMethods,
  type ForceGraphProps,
} from "react-force-graph-2d";
import type { GraphNode, GraphLink } from "@/hooks/useGraph";
import { nodeColor, linkColor } from "@/lib/graph-colors";

const PAPER = "hsl(42, 22%, 96%)";
const INK = "hsl(215, 30%, 12%)";

const LABEL_TO_PATH: Record<string, string> = {
  Person: "/people",
  Department: "/departments",
  Project: "/projects",
  Product: "/products",
  Supplier: "/suppliers",
  Location: "/locations",
};

export interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedId?: string | null;
  height?: number;
}

export function GraphCanvas({ nodes, links, selectedId, height = 640 }: GraphCanvasProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height });
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const [hoverId, setHoverId] = useState<string | null>(null);

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

  const graphData = {
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({ ...l })),
  };

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

  const handleClick = (node: GraphNode): void => {
    const path = LABEL_TO_PATH[node.label];
    if (path) navigate(`${path}/${node.id}`);
  };

  // nodeOpacity / linkOpacity are valid runtime props but missing from the
  // shipped d.ts, so carry them through the typed prop surface.
  const opacityProps = {
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
  } as ForceGraphProps<GraphNode, GraphLink>;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-md border border-border bg-background"
      style={{ height }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.width}
        height={size.height}
        backgroundColor={PAPER}
        nodeRelSize={5}
        nodeColor={(n) => nodeColor(n as GraphNode)}
        nodeLabel={(n) => (n as GraphNode).name}
        linkColor={(l) => linkColor(l as GraphLink)}
        linkWidth={(l) => {
          const link = l as GraphLink;
          const touches =
            link.source === hoverId ||
            link.target === hoverId ||
            (link.source as unknown as GraphNode)?.id === hoverId ||
            (link.target as unknown as GraphNode)?.id === hoverId;
          return touches ? 2.6 : 1.1;
        }}
        {...opacityProps}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        cooldownTicks={120}
        onNodeClick={(n) => handleClick(n as GraphNode)}
        onNodeHover={(n) => setHoverId(n ? (n as GraphNode).id : null)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x?: number; y?: number };
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const r = 6.5;
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
        }}
      />
    </div>
  );
}
