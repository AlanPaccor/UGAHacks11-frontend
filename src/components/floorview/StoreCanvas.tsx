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
}

export default function StoreCanvas({ positions, showHeatmap, onProductClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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
      className="relative bg-white border border-slate-200 rounded-xl overflow-hidden"
      style={{ aspectRatio: "10/7" }}
    >
      {/* Heatmap canvas overlay */}
      <HeatmapOverlay
        positions={positions}
        width={dimensions.width}
        height={dimensions.height}
        visible={showHeatmap}
      />

      {/* SVG layer: store layout + product dots */}
      <svg
        viewBox="0 0 1000 700"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow filter for tooltips */}
        <defs>
          <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Store layout (background) */}
        <StoreLayout />

        {/* Product dots (foreground) */}
        {positions.map((p) => (
          <ProductDot
            key={p.product.barcode}
            data={p}
            onClick={onProductClick}
          />
        ))}
      </svg>
    </div>
  );
}
