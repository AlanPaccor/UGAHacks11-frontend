import { useState, useRef, useCallback } from "react";
import type { Product } from "../../types/Product";

export type StockStatus = "healthy" | "low" | "critical";

export type StockAdvice = {
  overall: StockStatus;
  frontStatus: StockStatus;
  backStatus: StockStatus;
  frontAdvice: string | null;
  backAdvice: string | null;
  /** true when front is low but back has units to move */
  needsRestock: boolean;
  /** true when back stock is low and needs supplier reorder */
  needsReorder: boolean;
};

export interface ProductPosition {
  product: Product;
  x: number; // 0-1000 in SVG viewBox units
  y: number;
  zone: string;
}

interface Props {
  data: ProductPosition;
  onClick: (product: Product) => void;
  editMode?: boolean;
  onDragEnd?: (barcode: string, x: number, y: number) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

/** Check a single quantity against the threshold */
function checkLevel(qty: number, threshold: number): StockStatus {
  if (qty <= Math.ceil(threshold * 0.5)) return "critical";
  if (qty <= threshold) return "low";
  return "healthy";
}

/** Detailed advice for front vs back stock */
export function getStockAdvice(product: Product): StockAdvice {
  const { frontQuantity, backQuantity, reorderThreshold } = product;

  const frontStatus = checkLevel(frontQuantity, reorderThreshold);
  const backStatus = checkLevel(backQuantity, reorderThreshold);

  const frontLow = frontStatus !== "healthy";
  const backLow = backStatus !== "healthy";
  const hasBackup = backQuantity > 0;

  // Overall is the worst of the two
  let overall: StockStatus = "healthy";
  if (frontStatus === "critical" || backStatus === "critical") overall = "critical";
  else if (frontStatus === "low" || backStatus === "low") overall = "low";

  let frontAdvice: string | null = null;
  let backAdvice: string | null = null;

  if (frontStatus === "critical") {
    frontAdvice = hasBackup
      ? `Critically low — restock from back (${backQuantity} available)`
      : "Critically low — no back stock, reorder needed";
  } else if (frontStatus === "low") {
    frontAdvice = hasBackup
      ? `Running low — restock from back (${backQuantity} available)`
      : "Running low — no back stock, consider reorder";
  }

  if (backStatus === "critical") {
    backAdvice = "Critically low — reorder from supplier immediately";
  } else if (backStatus === "low") {
    backAdvice = "Running low — place supplier reorder soon";
  }

  return {
    overall,
    frontStatus,
    backStatus,
    frontAdvice,
    backAdvice,
    needsRestock: frontLow && hasBackup,
    needsReorder: backLow,
  };
}

/** Simple overall status for backwards compat (Legend, filters, heatmap) */
export function getStockStatus(product: Product): StockStatus {
  return getStockAdvice(product).overall;
}

export function getStockRatio(product: Product): number {
  const total = product.frontQuantity + product.backQuantity;
  const maxEstimate = Math.max(product.reorderThreshold * 5, total, 1);
  return Math.min(total / maxEstimate, 1);
}

const STATUS_COLORS: Record<StockStatus, { fill: string; ring: string; glow: string }> = {
  healthy: { fill: "#22c55e", ring: "#bbf7d0", glow: "rgba(34,197,94,0.4)" },
  low: { fill: "#eab308", ring: "#fef08a", glow: "rgba(234,179,8,0.5)" },
  critical: { fill: "#ef4444", ring: "#fecaca", glow: "rgba(239,68,68,0.6)" },
};

const ADVICE_ICON_COLORS: Record<StockStatus, string> = {
  healthy: "#22c55e",
  low: "#eab308",
  critical: "#ef4444",
};

/** Convert a mouse/pointer event to SVG viewBox coordinates */
function screenToSVG(
  svgEl: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const pt = svgEl.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: Math.round(svgPt.x), y: Math.round(svgPt.y) };
}

export default function ProductDot({
  data,
  onClick,
  editMode = false,
  onDragEnd,
  svgRef,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef(false);

  const advice = getStockAdvice(data.product);
  const status = advice.overall;
  const ratio = getStockRatio(data.product);
  const colors = STATUS_COLORS[status];

  const cx = dragPos?.x ?? data.x;
  const cy = dragPos?.y ?? data.y;

  const pulseRadius = status === "critical" ? 18 : status === "low" ? 14 : 0;

  // ── Drag handlers ──
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!editMode || !svgRef?.current) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragStartRef.current = true;
      setDragging(true);
    },
    [editMode, svgRef]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !svgRef?.current) return;
      const pos = screenToSVG(svgRef.current, e.clientX, e.clientY);
      pos.x = Math.max(25, Math.min(975, pos.x));
      pos.y = Math.max(25, Math.min(675, pos.y));
      setDragPos(pos);
    },
    [dragging, svgRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDragging(false);
      dragStartRef.current = false;
      if (dragPos && onDragEnd) {
        onDragEnd(data.product.barcode, dragPos.x, dragPos.y);
      }
      setDragPos(null);
    },
    [dragging, dragPos, onDragEnd, data.product.barcode]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editMode) return;
      e.stopPropagation();
      onClick(data.product);
    },
    [editMode, onClick, data.product]
  );

  // ── Tooltip sizing ──
  const hasAdvice = advice.frontAdvice || advice.backAdvice;
  const tooltipHeight = hasAdvice ? 108 : 68;
  const tooltipWidth = hasAdvice ? 210 : 160;

  return (
    <g
      className={editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
      onMouseEnter={() => !dragging && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Edit mode ring indicator */}
      {editMode && !dragging && (
        <circle
          cx={cx}
          cy={cy}
          r="16"
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeDasharray="3,3"
          opacity="0.5"
        />
      )}

      {/* Drag ghost ring */}
      {dragging && (
        <circle
          cx={cx}
          cy={cy}
          r="18"
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          opacity="0.7"
        />
      )}

      {/* Glow / pulse ring */}
      {status !== "healthy" && !editMode && (
        <circle
          cx={cx}
          cy={cy}
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

      {/* Needs-restock indicator (small arrow icon) */}
      {advice.needsRestock && !editMode && (
        <text
          x={cx + 12}
          y={cy - 8}
          fontSize="10"
          fontWeight="700"
          fill="#6366f1"
          opacity="0.9"
        >
          ↻
        </text>
      )}

      {/* Needs-reorder indicator (small + icon) */}
      {advice.needsReorder && !editMode && (
        <text
          x={cx - (advice.needsRestock ? 18 : -12)}
          y={cy - 8}
          fontSize="10"
          fontWeight="700"
          fill="#f59e0b"
          opacity="0.9"
        >
          ⬆
        </text>
      )}

      {/* Outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={hovered || dragging ? 13 : 10}
        fill={colors.ring}
        stroke={dragging ? "#6366f1" : colors.fill}
        strokeWidth={dragging ? "2.5" : "1.5"}
        style={{ transition: dragging ? "none" : "all 0.15s ease" }}
      />

      {/* Inner dot */}
      <circle
        cx={cx}
        cy={cy}
        r={Math.max(3, 7 * ratio)}
        fill={colors.fill}
        style={{ transition: dragging ? "none" : "r 0.15s ease" }}
      />

      {/* Product name label in edit mode */}
      {editMode && (
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill="#6366f1"
        >
          {data.product.name.length > 14
            ? data.product.name.slice(0, 14) + "..."
            : data.product.name}
        </text>
      )}

      {/* Tooltip (normal mode only) */}
      {hovered && !editMode && !dragging && (
        <g>
          <rect
            x={cx + 14}
            y={cy - 50}
            width={tooltipWidth}
            height={tooltipHeight}
            rx="6"
            fill="white"
            stroke="#e2e8f0"
            strokeWidth="1"
            filter="url(#tooltip-shadow)"
          />
          {/* Product name */}
          <text x={cx + 22} y={cy - 34} fontSize="11" fontWeight="600" fill="#1e293b">
            {data.product.name}
          </text>
          {/* Barcode */}
          <text x={cx + 22} y={cy - 22} fontSize="9" fill="#94a3b8" fontFamily="monospace">
            {data.product.barcode}
          </text>

          {/* Front stock row */}
          <circle cx={cx + 24} cy={cy - 8} r="3" fill={ADVICE_ICON_COLORS[advice.frontStatus]} />
          <text x={cx + 30} y={cy - 4} fontSize="9.5" fill="#475569">
            Front: {data.product.frontQuantity}
            {advice.frontStatus !== "healthy" ? " — needs restock" : ""}
          </text>

          {/* Back stock row */}
          <circle cx={cx + 24} cy={cy + 5} r="3" fill={ADVICE_ICON_COLORS[advice.backStatus]} />
          <text x={cx + 30} y={cy + 9} fontSize="9.5" fill="#475569">
            Back: {data.product.backQuantity}
            {advice.backStatus !== "healthy" ? " — needs reorder" : ""}
          </text>

          {/* Overall status */}
          <text x={cx + 22} y={cy + 23} fontSize="10" fontWeight="600" fill={colors.fill}>
            {data.product.frontQuantity + data.product.backQuantity} total — {status.toUpperCase()}
          </text>

          {/* Action advice lines */}
          {advice.frontAdvice && (
            <text x={cx + 22} y={cy + 37} fontSize="8.5" fontWeight="500" fill="#6366f1">
              → {advice.frontAdvice.length > 35
                ? advice.frontAdvice.slice(0, 35) + "..."
                : advice.frontAdvice}
            </text>
          )}
          {advice.backAdvice && (
            <text x={cx + 22} y={cy + 49} fontSize="8.5" fontWeight="500" fill="#f59e0b">
              → {advice.backAdvice.length > 35
                ? advice.backAdvice.slice(0, 35) + "..."
                : advice.backAdvice}
            </text>
          )}
        </g>
      )}
    </g>
  );
}
