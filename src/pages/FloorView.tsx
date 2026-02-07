import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutGrid,
  AlertTriangle,
  Package,
  Trash2,
} from "lucide-react";
import { getProducts } from "../services/api";
import StoreCanvas from "../components/floorview/StoreCanvas";
import Legend from "../components/floorview/Legend";
import FloorFilters from "../components/floorview/FloorFilters";
import ProductDetailModal from "../components/floorview/ProductDetailModal";
import { getStockStatus } from "../components/floorview/ProductDot";
import type { ProductPosition } from "../components/floorview/ProductDot";
import type { FilterState } from "../components/floorview/FloorFilters";
import type { Product } from "../types/Product";

// ── Zone definitions with coordinate ranges ──
// Products are distributed across these zones in the SVG viewBox (1000x700)
const ZONES = [
  { name: "Retail Floor", xMin: 60, xMax: 540, yMin: 100, yMax: 630 },
  { name: "Accessories", xMin: 785, xMax: 960, yMin: 40, yMax: 170 },
  { name: "Back Storage", xMin: 785, xMax: 960, yMin: 210, yMax: 400 },
] as const;

const ZONE_NAMES = ZONES.map((z) => z.name);

/**
 * Generate positions for products spread across the retail floor.
 * Uses a deterministic grid layout based on product index.
 */
function generatePositions(products: Product[]): ProductPosition[] {
  if (products.length === 0) return [];

  // Distribute products across zones with the majority on the retail floor
  return products.map((product, i) => {
    // Use barcode hash for deterministic but varied placement
    const hash = product.barcode
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // Assign zone: 70% retail, 15% accessories, 15% storage
    let zoneIndex: number;
    const mod = hash % 100;
    if (mod < 70) zoneIndex = 0; // Retail Floor
    else if (mod < 85) zoneIndex = 1; // Accessories
    else zoneIndex = 2; // Back Storage

    const zone = ZONES[zoneIndex];

    // Grid-based positioning within the zone
    const cols = Math.ceil(Math.sqrt(products.length));
    const row = Math.floor(i / cols);
    const col = i % cols;

    const xRange = zone.xMax - zone.xMin;
    const yRange = zone.yMax - zone.yMin;
    const xStep = xRange / (cols + 1);
    const yStep = yRange / (Math.ceil(products.length / cols) + 1);

    // Add small offset based on hash so dots don't overlap perfectly
    const xOff = ((hash * 7) % 30) - 15;
    const yOff = ((hash * 13) % 30) - 15;

    const x = Math.max(
      zone.xMin + 15,
      Math.min(zone.xMax - 15, zone.xMin + xStep * (col + 1) + xOff)
    );
    const y = Math.max(
      zone.yMin + 15,
      Math.min(zone.yMax - 15, zone.yMin + yStep * (row + 1) + yOff)
    );

    return {
      product,
      x,
      y,
      zone: zone.name,
    };
  });
}

export default function FloorView() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    showCriticalOnly: false,
    showHeatmap: false,
    selectedZone: "ALL",
  });

  const fetchProducts = useCallback(() => {
    getProducts()
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchProducts();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchProducts, 15000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  // Generate all positions
  const allPositions = useMemo(() => generatePositions(products), [products]);

  // Apply filters
  const filteredPositions = useMemo(() => {
    let result = allPositions;

    if (filters.showCriticalOnly) {
      result = result.filter(
        (p) => getStockStatus(p.product) === "critical"
      );
    }

    if (filters.selectedZone !== "ALL") {
      result = result.filter((p) => p.zone === filters.selectedZone);
    }

    return result;
  }, [allPositions, filters]);

  // Counts for legend
  const counts = useMemo(() => {
    const c = { healthy: 0, low: 0, critical: 0 };
    allPositions.forEach((p) => {
      c[getStockStatus(p.product)]++;
    });
    return c;
  }, [allPositions]);

  // Summary stats
  const totalStock = products.reduce(
    (s, p) => s + p.frontQuantity + p.backQuantity,
    0
  );
  const totalWaste = products.reduce((s, p) => s + p.wasteQuantity, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-600" />
              <h1 className="text-sm font-semibold text-slate-900">
                Floor Overview
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              {products.length} products
            </span>
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              {totalStock} total units
            </span>
            {counts.critical > 0 && (
              <span className="flex items-center gap-1.5 text-red-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {counts.critical} critical
              </span>
            )}
            {totalWaste > 0 && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Trash2 className="w-3.5 h-3.5" />
                {totalWaste} discarded
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-5">
          {/* Sidebar */}
          <div className="w-52 shrink-0 space-y-4">
            <Legend productCounts={counts} />
            <FloorFilters
              filters={filters}
              onChange={setFilters}
              zones={[...ZONE_NAMES]}
            />

            {/* Quick Stats */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total products</span>
                  <span className="font-semibold text-slate-700">
                    {products.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total units</span>
                  <span className="font-semibold text-slate-700">
                    {totalStock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Visible dots</span>
                  <span className="font-semibold text-slate-700">
                    {filteredPositions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <StoreCanvas
              positions={filteredPositions}
              showHeatmap={filters.showHeatmap}
              onProductClick={setSelectedProduct}
            />
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Hover to preview — Click for details — Auto-refreshes every 15s
            </p>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
