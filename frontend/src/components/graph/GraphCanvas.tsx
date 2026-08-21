import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type { GraphNode, GraphLink } from "@/hooks/useGraph";
import { nodeColor, linkColor } from "@/lib/graph-colors";

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

  const handleClick = (node: GraphNode): void => {
    const path = LABEL_TO_PATH[node.label];
    if (path) navigate(`${path}/${node.id}`);
  };

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-md border bg-card" style={{ height }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.width}
        height={size.height}
        backgroundColor="hsl(0, 0%, 100%)"
        nodeRelSize={5}
        nodeColor={(n) => nodeColor(n as GraphNode)}
        nodeLabel={(n) => (n as GraphNode).name}
        linkColor={(l) => linkColor(l as GraphLink)}
        linkWidth={1}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={0}
        cooldownTicks={120}
        onNodeClick={(n) => handleClick(n as GraphNode)}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as GraphNode & { x?: number; y?: number };
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          const r = 6;
          const isSelected = n.id === selectedId;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = nodeColor(n);
          ctx.fill();

          if (isSelected) {
            ctx.lineWidth = 2 / globalScale;
            ctx.strokeStyle = "hsl(222, 84%, 5%)";
            ctx.stroke();
          }

          if (globalScale >= 1.2) {
            const fontSize = 11 / globalScale;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "hsl(222, 84%, 5%)";
            ctx.fillText(n.name, x, y + r + 1);
          }
        }}
      />
    </div>
  );
}
