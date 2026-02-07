import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Heart,
  Map,
  Package,
} from "lucide-react";
import { getProducts } from "./services/api";
import InventoryManager from "./components/InventoryManager";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import AIInsightsCard from "./components/AIInsightsCard";
import AIPredictionCard from "./components/AIPredictionCard";
import DonateModal from "./components/DonateModal";
import type { Product } from "./types/Product";

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [donateOpen, setDonateOpen] = useState(false);

  const fetchProducts = useCallback(() => {
    getProducts()
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navigation Bar ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                StockSync
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">
                Inventory Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDonateOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Donate Surplus</span>
            </button>
            <button className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Overview Map</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Donate Modal ── */}
      {donateOpen && (
        <DonateModal
          products={products}
          onClose={() => setDonateOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Scanner & Actions */}
        <InventoryManager onTransactionComplete={fetchProducts} />

        {/* AI Insights */}
        <AIInsightsCard />

        {/* Analytics Dashboard */}
        <AnalyticsDashboard products={products} />

        {/* Product Inventory */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <LayoutDashboard className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              Product Inventory
            </h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
              {products.length} items
            </span>
          </div>
          {products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                No products found. Start by adding items through the scanner.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.barcode}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {product.barcode}
                      </p>
                    </div>
                    {product.frontQuantity + product.backQuantity <=
                    product.reorderThreshold ? (
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Low Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        In Stock
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                        Front
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {product.frontQuantity}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                        Back
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {product.backQuantity}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                        Discard
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {product.wasteQuantity}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400">
                      Reorder threshold: {product.reorderThreshold} units
                    </p>
                  </div>

                  <AIPredictionCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
