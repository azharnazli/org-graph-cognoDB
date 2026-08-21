import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D, {
  type ForceGraphMethods,
} from "react-force-graph-2d";
import type { GraphNode, GraphLink } from "@/hooks/useGraph";
import { nodeColor, LABEL_LEGEND } from "@/lib/graph-colors";
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

// Radius of the visible node (px, before zoom). Everything — painting,
// collision spacing and the minimum hit target — is derived from it.
const NODE_REL_SIZE = 17;

// Canvas background colour — used to paint a halo behind each node label so
// the text stays readable over links and other nodes.
const GRAPH_BG = "hsl(42, 22%, 96%)";

// Label font size in screen px (divided by the current zoom to keep constant).
const LABEL_FONT_SIZE = 11;

// Screen-space radius (px) around a node's centre that counts as a hit for
// click / drag / hover. Expressed in screen pixels and divided by the current
// zoom, so a tiny node in a zoomed-out full graph stays exactly as easy to
// grab as a big one in a zoomed-in view.
const HIT_RADIUS_PX = 22;

// A pointer must move this many screen px before a press turns into a drag
// (as opposed to a click). Mirrors the library's own click/drag tolerance.
const DRAG_MOVE_THRESHOLD_PX = 5;

// The library's built-in drag and hover both hit-test by reading ONE pixel
// from a hidden shadow canvas. When two node hit-circles overlap, the
// last-painted node wins that pixel, so a node underneath a neighbour can
// never be dragged or hovered. We bypass that entire mechanism: every
// interaction below uses a nearest-centre search in graph space, so every
// node — even one sitting behind another — is individually clickable,
// draggable and hoverable.
export function GraphCanvas({ nodes, links, selectedId, height = 640, onNodeClick }: GraphCanvasProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height });
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Last pointer client coords — used to anchor the hover tooltip without
  // forcing a React re-render on every mousemove (the tooltip is positioned
  // imperatively via its DOM ref).
  const pointerClientRef = useRef({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);

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
  // hit detection below, since the React-side `nodes` prop never receives
  // those updates. A ref to graphData captures the mutated copies.
  const graphDataRef = useRef(graphData);
  graphDataRef.current = graphData;

  // The graphData copies get their link source/target rewritten into node
  // objects by d3-force, but the prop links keep string ids — subtree
  // traversal reads from here so it always sees ids.
  const linksRef = useRef(links);
  linksRef.current = links;

  // Captured each frame from the canvas 2D context's transform. The library
  // applies pan/zoom via `ctx.setTransform(...)` during draw, so we have to
  // grab it from the rendered frame to invert it for screen→graph coords.
  const ctxTransformRef = useRef<DOMMatrix | null>(null);

  // Retune the d3 forces once the engine is up. The defaults are tuned for a
  // quick, dense packing — which produces overlapping nodes. Because every
  // interaction below uses nearest-centre search, overlap no longer breaks
  // click/drag, but visually overlapping nodes are still unreadable, so we
  // keep a collision radius that guarantees circles don't touch.
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
    // 3. Collision radius just past twice the largest visible radius (a
    //    selected node is NODE_REL_SIZE * sqrt(2) ≈ 24px) so neighbouring
    //    circles keep a small gap instead of touching.
    const collide = fg.d3Force("collide");
    if (collide && "radius" in collide) {
      (collide as unknown as { radius: (n: number) => unknown }).radius(52);
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

  // Shared click handler — invoked by the canvas-level click handler below.
  // Resolves which behaviour to take (inspect-only vs navigate) based on the
  // `onNodeClick` prop.
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

  // nodeOpacity / linkOpacity are valid runtime props but missing from the
  // shipped d.ts, so carry them through the typed prop surface. Cast the
  // merged bag through unknown to bypass the strict prop surface.
  const interactionProps = useMemo(
    () => ({
      // nodeOpacity / linkOpacity are ignored by this library version, so the
      // hover dimming is done inside the custom node painter below.
      linkWidth: (l: GraphLink) => {
        const touches =
          l.source === hoverId ||
          l.target === hoverId ||
          (l.source as unknown as GraphNode)?.id === hoverId ||
          (l.target as unknown as GraphNode)?.id === hoverId;
        return touches ? 2.6 : 1.1;
      },
      // Keep the render loop running every frame (instead of only while the
      // simulation is warm). A dragged node is moved by setting its x/fx
      // directly — with the paused render loop that position change would
      // never reach the canvas, so the node would stop following the cursor.
      autoPauseRedraw: false,
    }),
    [hoverNeighbors, hoverId],
  ) as unknown as Record<string, unknown>;

  // ---------------------------------------------------------------------------
  // Custom interaction layer.
  //
  // The library's built-in drag (`enableNodeDrag={false}`) and its hover and
  // click detection all rely on the broken single-pixel shadow-canvas test, so
  // they're disabled and re-implemented here with a nearest-centre search.
  // ---------------------------------------------------------------------------
  const dragStateRef = useRef<{
    node: GraphNode;
    pointerId: number;
    moved: boolean;
    // Subtree that follows the dragged node: the descendant node objects
    // (from graphDataRef, so they carry live x/y) plus each one's original
    // position, and the dragged node's position when the drag started.
    startX: number;
    startY: number;
    children: Array<GraphNode & { x: number; y: number; fx: number | undefined; fy: number | undefined }>;
    orig: Array<{ x: number; y: number }>;
  } | null>(null);
  const suppressClickRef = useRef(false);

  // Move the hover tooltip to follow the cursor. Position is applied directly
  // to the tooltip's DOM node so frequent mousemoves don't re-render React.
  const positionTooltip = useCallback((clientX: number, clientY: number) => {
    const tip = tooltipRef.current;
    const container = containerRef.current;
    if (!tip || !container) return;
    const rect = container.getBoundingClientRect();
    tip.style.transform = `translate(${clientX - rect.left + 14}px, ${clientY - rect.top + 14}px)`;
  }, []);

  // The tooltip mounts when hoverId changes; anchor it at the last known
  // pointer position (which onPointerMove has already recorded).
  useEffect(() => {
    if (hoverId) positionTooltip(pointerClientRef.current.x, pointerClientRef.current.y);
  }, [hoverId, positionTooltip]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = container.querySelector("canvas");
    if (!canvas) return;

    // The canvas's cursor is otherwise pinned by the library's `.clickable`
    // class; let our own cursor style on the container win instead.
    canvas.style.cursor = "inherit";

    // Map screen → graph coords using the inverse of the canvas transform.
    // Identity fallback handles a click that races the first painted frame.
    const toGraph = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const m = ctxTransformRef.current ?? new DOMMatrix();
      const inv = m.inverse();
      return {
        x: inv.a * sx + inv.c * sy + inv.e,
        y: inv.b * sx + inv.d * sy + inv.f,
        scale: m.a,
      };
    };

    // Closest node centre within `radius` (graph units) of the given point.
    // This — not the library's pixel read — is what makes hidden nodes
    // grabbable: the search covers the whole area instead of one pixel.
    const nearestNode = (gx: number, gy: number, radius: number): GraphNode | null => {
      let closest: GraphNode | null = null;
      let closestDist = Infinity;
      for (const node of graphDataRef.current.nodes) {
        // d3-force mutates x/y onto nodes at runtime; the GraphNode type
        // doesn't declare them, so narrow via intersection.
        const nx = (node as GraphNode & { x?: number }).x;
        const ny = (node as GraphNode & { y?: number }).y;
        if (typeof nx !== "number" || typeof ny !== "number") continue;
        const dx = nx - gx;
        const dy = ny - gy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < radius && d < closestDist) {
          closest = node;
          closestDist = d;
        }
      }
      return closest;
    };

    const onPointerDown = (e: PointerEvent): void => {
      // Only the primary button starts a drag; right-click stays reserved for
      // the "unpin" context-menu action below.
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const { x, y, scale } = toGraph(e.clientX, e.clientY);
      const node = nearestNode(x, y, HIT_RADIUS_PX / scale);
      if (!node) return;
      const live = node as GraphNode & { x: number; y: number };
      const startX = live.x;
      const startY = live.y;

      // Descendants that hang "below" this node — children point at their
      // parent (e.g. employee -[:REPORTS_TO]-> manager), so traverse links
      // backwards from the grabbed node. Dragging the parent carries them.
      const childIds: string[] = [];
      const visited = new Set<string>([node.id]);
      const queue = [node.id];
      while (queue.length) {
        const cur = queue.shift()!;
        for (const l of linksRef.current) {
          if ((l.target as string) === cur) {
            const s = l.source as string;
            if (!visited.has(s)) {
              visited.add(s);
              childIds.push(s);
              queue.push(s);
            }
          }
        }
      }
      const children = childIds
        .map((id) => graphDataRef.current.nodes.find((n) => n.id === id))
        .filter(
          (n): n is GraphNode & { x: number; y: number; fx: number | undefined; fy: number | undefined } =>
            !!n && typeof (n as { x?: number }).x === "number" && typeof (n as { y?: number }).y === "number",
        );
      const orig = children.map((c) => ({ x: c.x, y: c.y }));

      dragStateRef.current = { node, pointerId: e.pointerId, moved: false, startX, startY, children, orig };
      if (!canvas.hasPointerCapture(e.pointerId)) canvas.setPointerCapture(e.pointerId);
      setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent): void => {
      const { x, y, scale } = toGraph(e.clientX, e.clientY);
      pointerClientRef.current = { x: e.clientX, y: e.clientY };
      positionTooltip(e.clientX, e.clientY);

      const drag = dragStateRef.current;
      if (drag && drag.pointerId === e.pointerId) {
        const node = drag.node as GraphNode & { x: number; y: number; fx: number | undefined; fy: number | undefined };
        const dx = x - node.x;
        const dy = y - node.y;
        if (!drag.moved) {
          drag.moved = dx * dx + dy * dy > DRAG_MOVE_THRESHOLD_PX * DRAG_MOVE_THRESHOLD_PX;
          if (drag.moved) {
            // Freeze the rest of the graph so the pinned node tracks cleanly.
            node.fx = node.x;
            node.fy = node.y;
          }
        }
        if (drag.moved) {
          // Pin to the cursor. x/fx together — the library paints from x/y
          // while d3-force respects fx/fy as fixed.
          node.fx = node.x = x;
          node.fy = node.y = y;
          // Carry the grabbed node's whole subtree along by the same offset,
          // so children stay hooked to the node (rigid drag).
          const dx = x - drag.startX;
          const dy = y - drag.startY;
          for (let i = 0; i < drag.children.length; i++) {
            const c = drag.children[i];
            const o = drag.orig[i];
            if (!c || !o) continue;
            c.fx = c.x = o.x + dx;
            c.fy = c.y = o.y + dy;
          }
          // Keep the canvas from panning/scrolling while a node is in hand.
          e.preventDefault();
          // Drop the hover tooltip while a node is being dragged.
          setHoverId(null);
        }
        return;
      }

      const r = HIT_RADIUS_PX / scale;
      const hover = nearestNode(x, y, r);
      setHoverId(hover ? hover.id : null);
    };

    const endDrag = (e: PointerEvent): void => {
      const drag = dragStateRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragStateRef.current = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      // A click event fires after a real drag too — swallow it so a drag
      // doesn't also navigate. Cleared on a short timer in case the click
      // lands on a different element (or not at all).
      if (drag.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 150);
      }
    };

    // The library attaches its own mousedown/touchstart listeners (drag +
    // zoom) to the canvas. A capture-phase listener runs before them, so once
    // a node is being dragged we swallow the event and stop a zoom/pan gesture
    // from hijacking the pointer. `Event` covers both mouse and touch input.
    const blockDuringDrag = (e: Event): void => {
      if (dragStateRef.current) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    const onClick = (e: MouseEvent): void => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      const { x, y, scale } = toGraph(e.clientX, e.clientY);
      const node = nearestNode(x, y, HIT_RADIUS_PX / scale);
      if (node) handleNode(node);
    };

    // Right-click a node to release its drag pin and let the simulation
    // re-place it.
    const onContextMenu = (e: MouseEvent): void => {
      e.preventDefault();
      const { x, y, scale } = toGraph(e.clientX, e.clientY);
      const node = nearestNode(x, y, HIT_RADIUS_PX / scale);
      if (!node) return;
      const n = node as GraphNode & { fx: number | undefined; fy: number | undefined };
      n.fx = undefined;
      n.fy = undefined;
    };

    const onPointerLeave = (): void => setHoverId(null);

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove, { passive: false });
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("mousedown", blockDuringDrag, { capture: true });
    canvas.addEventListener("touchstart", blockDuringDrag, { capture: true, passive: false });
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("mousedown", blockDuringDrag, { capture: true });
      canvas.removeEventListener("touchstart", blockDuringDrag, { capture: true });
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
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

  // Replace the library's default node paint so every node also renders its
  // label under the dot (the library only draws a circle by default). Paints
  // in graph coords; font/line sizes are divided by the zoom so they stay a
  // constant size on screen.
  const nodeCanvasObjectMode = useCallback(() => "replace" as const, []);
  const nodeCanvasObject = useCallback(
    (raw: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = raw as GraphNode & { x: number; y: number };
      const color = nodeColorFn(node);
      const r = Math.sqrt(Math.max(0, nodeVal(node) || 1)) * NODE_REL_SIZE;

      // Dim everything outside the hovered node's neighbourhood (the library
      // ships a nodeOpacity prop for this, but this version never applies it).
      const dimmed = hoverId !== null && hoverNeighbors !== null && !hoverNeighbors.has(node.id);
      ctx.globalAlpha = dimmed ? 0.22 : 1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2, false);
      ctx.fillStyle = color;
      ctx.fill();
      if (selectedId === node.id) {
        ctx.lineWidth = 2.5 / globalScale;
        ctx.strokeStyle = "rgba(15, 20, 30, 0.6)";
        ctx.stroke();
      }

      // Label — drawn with a background-colour halo so it stays readable over
      // links and neighbouring nodes.
      const fontSize = LABEL_FONT_SIZE / globalScale;
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 3 / globalScale;
      ctx.lineJoin = "round";
      const ly = node.y + r + 3 / globalScale;
      ctx.strokeStyle = GRAPH_BG;
      ctx.strokeText(node.name, node.x, ly);
      ctx.fillStyle = color;
      ctx.fillText(node.name, node.x, ly);

      ctx.globalAlpha = 1;
    },
    [nodeColorFn, nodeVal, hoverId, hoverNeighbors, selectedId],
  );

  // The node currently under the cursor — the source of the hover tooltip
  // content. Read from graphDataRef so we get the live (d3-mutated) node.
  const hoverNode = hoverId
    ? (graphDataRef.current.nodes.find((n) => n.id === hoverId) as (GraphNode & { name?: string; label?: string }) | undefined) ?? null
    : null;

  // Capture the canvas's current transform every frame so the interaction
  // handlers can map screen coords back to graph coords.
  const handleRenderFramePost = useCallback((ctx: CanvasRenderingContext2D) => {
    ctxTransformRef.current = ctx.getTransform();
  }, []);

  // Cursor: grabbing while a drag is active, grab when hovering a node, default otherwise.
  const cursor = isDragging ? "grabbing" : hoverId ? "grab" : "default";

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md border border-border bg-background"
      style={{ height, cursor }}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={size.width}
        height={size.height}
        backgroundColor={GRAPH_BG}
        nodeRelSize={NODE_REL_SIZE}
        nodeVal={nodeVal}
        nodeLabel={(n: GraphNode) => n.name}
        nodeCanvasObjectMode={nodeCanvasObjectMode}
        nodeCanvasObject={nodeCanvasObject}
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
        enableNodeDrag={false}
        // Turn off the library's built-in hover/click/tooltip detection — it
        // reads one pixel from a hidden shadow canvas and misses any node
        // sitting underneath a neighbour. Our custom layer below replaces it.
        enablePointerInteraction={false}
        {...interactionProps}
        onRenderFramePost={handleRenderFramePost}
      />
      {hoverNode && (
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute left-0 top-0 z-20 max-w-[280px] rounded-md border border-border bg-background px-2 py-1.5 shadow-md"
        >
          <div className="text-xs font-semibold leading-tight">{hoverNode.name}</div>
          {hoverNode.label && hoverNode.label !== hoverNode.name && (
            <div className="mt-0.5 text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
              {hoverNode.label}
            </div>
          )}
        </div>
      )}
      {/* Dot-colour legend. pointer-events-none so it never intercepts the
          clicks/drags that land on nodes underneath it. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 border-t border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
        {LABEL_LEGEND.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
