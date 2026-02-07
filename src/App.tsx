import { useEffect, useState, useCallback } from "react";
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
    <div className="min-h-screen bg-gray-100 p-8">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          🛒 Inventory
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setDonateOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm"
          >
            💚 Donate Waste
          </button>
          <button
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
          >
            🗺️ Overview Map
          </button>
        </div>
      </div>

      {/* ── Donate Modal ── */}
      {donateOpen && (
        <DonateModal
          products={products}
          onClose={() => setDonateOpen(false)}
        />
      )}

      {/* ── Scanner & Actions ── */}
      <InventoryManager onTransactionComplete={fetchProducts} />

      {/* ── AI Insights (Gemini) ── */}
      <AIInsightsCard />

      {/* ── Analytics Dashboard ── */}
      <AnalyticsDashboard products={products} />

      {/* ── Product Cards ── */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          📋 All Products
        </h2>
        {products.length === 0 ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.barcode}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {product.name}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Barcode: {product.barcode}
                </p>
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  <p>
                    Front:{" "}
                    <span className="font-medium">
                      {product.frontQuantity}
                    </span>
                  </p>
                  <p>
                    Back:{" "}
                    <span className="font-medium">
                      {product.backQuantity}
                    </span>
                  </p>
                  <p>
                    Discard:{" "}
                    <span className="font-medium">
                      {product.wasteQuantity}
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Reorder at ≤ {product.reorderThreshold}
                  </span>
                  {product.frontQuantity + product.backQuantity <=
                  product.reorderThreshold ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      Low Stock
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      In Stock
                    </span>
                  )}
                </div>

                {/* ── AI Prediction per product ── */}
                <AIPredictionCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
