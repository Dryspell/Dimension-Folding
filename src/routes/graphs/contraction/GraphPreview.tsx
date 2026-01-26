// GraphPreview.tsx - Small graph visualization for the contraction game
import { onMount, createEffect, Accessor } from "solid-js";
import Graph from "graphology";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface GraphPreviewProps {
  graph: Accessor<Graph>;
  width?: number;
  height?: number;
  /** Optional: highlight specific vertices */
  highlightedVertices?: Accessor<string[]>;
}

/**
 * Small 2D graph visualization showing nodes and edges.
 */
export default function GraphPreview(props: GraphPreviewProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  
  const width = props.width ?? 280;
  const height = props.height ?? 200;

  const render = () => {
    const canvas = canvasRef;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const graph = props.graph();
    const highlighted = props.highlightedVertices?.() ?? [];

    // Clear
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, width, height);

    // Compute layout if not already present
    const nodes: { id: string; x: number; y: number; label: string; color: string }[] = [];
    const n = graph.order;
    
    let i = 0;
    graph.forEachNode((nodeId, attrs) => {
      // Use existing layout or compute circular layout
      let x = attrs.x as number | undefined;
      let y = attrs.y as number | undefined;
      
      if (x === undefined || y === undefined) {
        // Circular layout
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const radius = Math.min(width, height) * 0.35;
        x = 0.5 + (radius / width) * Math.cos(angle);
        y = 0.5 + (radius / height) * Math.sin(angle);
      }

      nodes.push({
        id: nodeId,
        x: x * width,
        y: y * height,
        label: (attrs.label as string) || nodeId,
        color: (attrs.color as string) || "#3b82f6",
      });
      i++;
    });

    // Create lookup for node positions
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Draw edges
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    graph.forEachEdge((edge, attrs, source, target) => {
      const sourceNode = nodeMap.get(source);
      const targetNode = nodeMap.get(target);
      if (!sourceNode || !targetNode) return;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.stroke();
    });

    // Draw nodes
    const nodeRadius = Math.max(8, Math.min(15, 100 / n));
    for (const node of nodes) {
      const isHighlighted = highlighted.includes(node.id) || highlighted.includes(node.label);
      
      // Shadow
      ctx.beginPath();
      ctx.arc(node.x + 1, node.y + 1, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Highlight ring
      if (isHighlighted) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = "#1f2937";
      ctx.font = `${Math.max(9, 12 - n / 3)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(node.label, node.x, node.y + nodeRadius + 3);
    }
  };

  onMount(() => {
    render();
  });

  // Re-render when graph changes
  createEffect(() => {
    props.graph(); // Track dependency
    props.highlightedVertices?.(); // Track highlights
    render();
  });

  return (
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base">Graph Structure</CardTitle>
      </CardHeader>
      <CardContent class="p-2">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          class="rounded border bg-muted/20"
        />
      </CardContent>
    </Card>
  );
}
