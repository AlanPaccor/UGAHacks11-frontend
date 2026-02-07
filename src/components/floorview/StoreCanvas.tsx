import { useRef, useState, useEffect } from "react";
import StoreLayout from "./StoreLayout";
import ProductDot from "./ProductDot";
import HeatmapOverlay from "./HeatmapOverlay";
import type { ProductPosition } from "./ProductDot";
import type { Product } from "../../types/Product";

interface Props {
  positions: ProductPosition[];
  showHeatmap: boolean;
  onProductClick: (product: Product) => void;
  editMode?: boolean;
  onDotDragEnd?: (barcode: string, x: number, y: number) => void;
}

export default function StoreCanvas({
  positions,
  showHeatmap,
  onProductClick,
  editMode = false,
  onDotDragEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-white border rounded-xl overflow-hidden ${
        editMode ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
      }`}
      style={{ aspectRatio: "10/7" }}
    >
      {/* Heatmap canvas overlay */}
      <HeatmapOverlay
        positions={positions}
        width={dimensions.width}
        height={dimensions.height}
        visible={showHeatmap && !editMode}
      />

      {/* SVG layer */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Store layout */}
        <StoreLayout />

        {/* Product dots */}
        {positions.map((p) => (
          <ProductDot
            key={p.product.barcode}
            data={p}
            onClick={onProductClick}
            editMode={editMode}
            onDragEnd={onDotDragEnd}
            svgRef={svgRef}
          />
        ))}
      </svg>

      {/* Edit mode banner */}
      {editMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-lg pointer-events-none">
          Drag products to position them on the map
        </div>
      )}
    </div>
  );
}
