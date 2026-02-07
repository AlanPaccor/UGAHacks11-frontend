import { useState, useRef } from "react";
import type { Product } from "../../types/Product";

export type StockStatus = "healthy" | "low" | "critical";

export interface ProductPosition {
  product: Product;
  x: number; // 0-1000 in SVG viewBox units
  y: number;
  zone: string;
}

interface Props {
  data: ProductPosition;
  onClick: (product: Product) => void;
}

export function getStockStatus(product: Product): StockStatus {
  const total = product.frontQuantity + product.backQuantity;
  if (total <= product.reorderThreshold * 0.5) return "critical";
  if (total <= product.reorderThreshold) return "low";
  return "healthy";
}

export function getStockRatio(product: Product): number {
  const total = product.frontQuantity + product.backQuantity;
  // Assume max stock is roughly threshold * 5 (heuristic)
  const maxEstimate = Math.max(product.reorderThreshold * 5, total, 1);
  return Math.min(total / maxEstimate, 1);
}

const STATUS_COLORS: Record<StockStatus, { fill: string; ring: string; glow: string }> = {
  healthy: { fill: "#22c55e", ring: "#bbf7d0", glow: "rgba(34,197,94,0.4)" },
  low: { fill: "#eab308", ring: "#fef08a", glow: "rgba(234,179,8,0.5)" },
  critical: { fill: "#ef4444", ring: "#fecaca", glow: "rgba(239,68,68,0.6)" },
};

export default function ProductDot({ data, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const tooltipRef = useRef<SVGGElement>(null);

  const status = getStockStatus(data.product);
  const ratio = getStockRatio(data.product);
  const colors = STATUS_COLORS[status];
  const total = data.product.frontQuantity + data.product.backQuantity;

  // Pulse animation for critical items
  const pulseRadius = status === "critical" ? 18 : status === "low" ? 14 : 0;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(data.product)}
    >
      {/* Glow / pulse ring */}
      {status !== "healthy" && (
        <circle
          cx={data.x}
          cy={data.y}
          r={pulseRadius}
          fill="none"
          stroke={colors.glow}
          strokeWidth="2"
          opacity={0.6}
        >
          <animate
            attributeName="r"
            values={`${pulseRadius};${pulseRadius + 8};${pulseRadius}`}
            dur={status === "critical" ? "1s" : "2s"}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0.1;0.6"
            dur={status === "critical" ? "1s" : "2s"}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Outer ring */}
      <circle
        cx={data.x}
        cy={data.y}
        r={hovered ? 13 : 10}
        fill={colors.ring}
        stroke={colors.fill}
        strokeWidth="1.5"
        style={{ transition: "r 0.15s ease" }}
      />

      {/* Inner dot — size varies with stock ratio */}
      <circle
        cx={data.x}
        cy={data.y}
        r={Math.max(3, 7 * ratio)}
        fill={colors.fill}
        style={{ transition: "r 0.15s ease" }}
      />

      {/* Tooltip */}
      {hovered && (
        <g ref={tooltipRef}>
          {/* Tooltip background */}
          <rect
            x={data.x + 14}
            y={data.y - 42}
            width="160"
            height="68"
            rx="6"
            fill="white"
            stroke="#e2e8f0"
            strokeWidth="1"
            filter="url(#tooltip-shadow)"
          />
          {/* Product name */}
          <text
            x={data.x + 22}
            y={data.y - 24}
            fontSize="11"
            fontWeight="600"
            fill="#1e293b"
          >
            {data.product.name}
          </text>
          {/* Barcode */}
          <text
            x={data.x + 22}
            y={data.y - 12}
            fontSize="9"
            fill="#94a3b8"
            fontFamily="monospace"
          >
            {data.product.barcode}
          </text>
          {/* Stock info */}
          <text
            x={data.x + 22}
            y={data.y + 2}
            fontSize="10"
            fill="#475569"
          >
            Front: {data.product.frontQuantity} / Back: {data.product.backQuantity}
          </text>
          {/* Status */}
          <text
            x={data.x + 22}
            y={data.y + 16}
            fontSize="10"
            fontWeight="600"
            fill={colors.fill}
          >
            {total} total — {status.toUpperCase()}
          </text>
        </g>
      )}
    </g>
  );
}
