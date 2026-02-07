import { X, ShoppingCart, PackagePlus, ArrowRightLeft, Trash2 } from "lucide-react";
import { getStockStatus } from "./ProductDot";
import type { Product } from "../../types/Product";

interface Props {
  product: Product;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  healthy: {
    label: "Healthy",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  low: {
    label: "Low Stock",
    cls: "text-amber-700 bg-amber-50 border-amber-200",
  },
  critical: {
    label: "Critical",
    cls: "text-red-700 bg-red-50 border-red-200",
  },
};

export default function ProductDetailModal({ product, onClose }: Props) {
  const status = getStockStatus(product);
  const badge = STATUS_BADGE[status];
  const total = product.frontQuantity + product.backQuantity;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {product.name}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {product.barcode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Status</span>
            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wide ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>

          {/* Stock levels */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                Front
              </p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {product.frontQuantity}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                Back
              </p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {product.backQuantity}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                Discard
              </p>
              <p className="text-xl font-bold text-red-600 mt-0.5">
                {product.wasteQuantity}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total stock</span>
              <span className="font-semibold text-slate-900">{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reorder threshold</span>
              <span className="font-semibold text-slate-900">
                {product.reorderThreshold}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Capacity used</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      status === "critical"
                        ? "bg-red-500"
                        : status === "low"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (total / Math.max(product.reorderThreshold * 5, 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-2">
              Quick Actions
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <ShoppingCart className="w-4 h-4" />, label: "Sale", color: "text-indigo-600" },
                { icon: <PackagePlus className="w-4 h-4" />, label: "Receive", color: "text-emerald-600" },
                { icon: <ArrowRightLeft className="w-4 h-4" />, label: "Restock", color: "text-amber-600" },
                { icon: <Trash2 className="w-4 h-4" />, label: "Discard", color: "text-red-600" },
              ].map((a) => (
                <button
                  key={a.label}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <span className={a.color}>{a.icon}</span>
                  <span className="text-[10px] font-medium text-slate-600">
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
