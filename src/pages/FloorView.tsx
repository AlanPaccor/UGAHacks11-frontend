import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LayoutGrid,
  AlertTriangle,
  Package,
  Trash2,
  Pencil,
  Check,
  RotateCcw,
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

// ── localStorage key ──
const POSITIONS_KEY = "stocksync_floor_positions";

// ── Zone definitions ──
const ZONES = [
  { name: "Retail Floor", xMin: 60, xMax: 540, yMin: 100, yMax: 630 },
  { name: "Accessories", xMin: 785, xMax: 960, yMin: 40, yMax: 170 },
  { name: "Back Storage", xMin: 785, xMax: 960, yMin: 210, yMax: 400 },
] as const;

const ZONE_NAMES = ZONES.map((z) => z.name);

// ── Saved position type ──
interface SavedPosition {
  x: number;
  y: number;
}

function loadSavedPositions(): Record<string, SavedPosition> {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSavedPositions(positions: Record<string, SavedPosition>) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
}

/** Determine which zone a point falls into */
function getZoneForPoint(x: number, y: number): string {
  for (const zone of ZONES) {
    if (x >= zone.xMin && x <= zone.xMax && y >= zone.yMin && y <= zone.yMax) {
      return zone.name;
    }
  }
  return "Retail Floor";
}

/**
 * Generate default positions for products.
 * If a product has a saved position, use that instead.
 */
function generatePositions(
  products: Product[],
  saved: Record<string, SavedPosition>
): ProductPosition[] {
  if (products.length === 0) return [];

  return products.map((product, i) => {
    // Use saved position if it exists
    if (saved[product.barcode]) {
      const { x, y } = saved[product.barcode];
      return { product, x, y, zone: getZoneForPoint(x, y) };
    }

    // Otherwise, auto-generate
    const hash = product.barcode
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    let zoneIndex: number;
    const mod = hash % 100;
    if (mod < 70) zoneIndex = 0;
    else if (mod < 85) zoneIndex = 1;
    else zoneIndex = 2;

    const zone = ZONES[zoneIndex];

    const cols = Math.ceil(Math.sqrt(products.length));
    const row = Math.floor(i / cols);
    const col = i % cols;

    const xRange = zone.xMax - zone.xMin;
    const yRange = zone.yMax - zone.yMin;
    const xStep = xRange / (cols + 1);
    const yStep = yRange / (Math.ceil(products.length / cols) + 1);

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

    return { product, x, y, zone: zone.name };
  });
}

export default function FloorView() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savedPositions, setSavedPositions] = useState<Record<string, SavedPosition>>(
    loadSavedPositions
  );
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
    const interval = setInterval(fetchProducts, 15000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  // Generate positions using saved data
  const allPositions = useMemo(
    () => generatePositions(products, savedPositions),
    [products, savedPositions]
  );

  // Apply filters
  const filteredPositions = useMemo(() => {
    let result = allPositions;

    if (filters.showCriticalOnly) {
      result = result.filter((p) => getStockStatus(p.product) === "critical");
    }

    if (filters.selectedZone !== "ALL") {
      result = result.filter((p) => p.zone === filters.selectedZone);
    }

    return result;
  }, [allPositions, filters]);

  // Counts
  const counts = useMemo(() => {
    const c = { healthy: 0, low: 0, critical: 0 };
    allPositions.forEach((p) => {
      c[getStockStatus(p.product)]++;
    });
    return c;
  }, [allPositions]);

  const totalStock = products.reduce(
    (s, p) => s + p.frontQuantity + p.backQuantity,
    0
  );
  const totalWaste = products.reduce((s, p) => s + p.wasteQuantity, 0);

  // ── Drag handler — save position ──
  const handleDotDragEnd = useCallback(
    (barcode: string, x: number, y: number) => {
      setSavedPositions((prev) => {
        const next = { ...prev, [barcode]: { x, y } };
        saveSavedPositions(next);
        return next;
      });
    },
    []
  );

  // ── Reset all positions ──
  const handleResetPositions = useCallback(() => {
    setSavedPositions({});
    localStorage.removeItem(POSITIONS_KEY);
  }, []);

  const savedCount = Object.keys(savedPositions).length;

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

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 mr-2">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                {products.length} products
              </span>
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" />
                {totalStock} units
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

            {/* Edit / Done button */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                editMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {editMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Done
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Layout
                </>
              )}
            </button>
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
                <div className="flex justify-between">
                  <span className="text-slate-500">Pinned positions</span>
                  <span className="font-semibold text-indigo-600">
                    {savedCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset positions */}
            {savedCount > 0 && (
              <button
                onClick={handleResetPositions}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset all positions
              </button>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 min-w-0">
            <StoreCanvas
              positions={filteredPositions}
              showHeatmap={filters.showHeatmap}
              onProductClick={setSelectedProduct}
              editMode={editMode}
              onDotDragEnd={handleDotDragEnd}
            />
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              {editMode
                ? "Drag products to their correct location — positions auto-save"
                : "Hover to preview — Click for details — Auto-refreshes every 15s"}
            </p>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && !editMode && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
