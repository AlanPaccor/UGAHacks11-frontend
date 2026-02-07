import { useEffect, useRef } from "react";
import type { ProductPosition } from "./ProductDot";
import { getStockStatus } from "./ProductDot";

interface Props {
  positions: ProductPosition[];
  width: number;
  height: number;
  visible: boolean;
}

/**
 * Canvas overlay that renders urgency heatmap.
 * Areas near critical/low products glow with warm colors.
 * "Where should workers go first?"
 */
export default function HeatmapOverlay({
  positions,
  width,
  height,
  visible,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Scale factors from SVG viewBox (1000x700) to canvas pixels
    const sx = width / 1000;
    const sy = height / 700;

    // Draw radial gradients for each product needing attention
    positions.forEach((p) => {
      const status = getStockStatus(p.product);
      if (status === "healthy") return;

      const cx = p.x * sx;
      const cy = p.y * sy;
      const radius = status === "critical" ? 80 * sx : 50 * sx;
      const alpha = status === "critical" ? 0.25 : 0.12;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(
        0,
        status === "critical"
          ? `rgba(239,68,68,${alpha})`
          : `rgba(234,179,8,${alpha})`
      );
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    });
  }, [positions, width, height, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
