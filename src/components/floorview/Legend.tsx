import { ArrowRightLeft, PackagePlus } from "lucide-react";

interface Props {
  productCounts: {
    healthy: number;
    low: number;
    critical: number;
    needsRestock: number;
    needsReorder: number;
  };
}

const STATUS_ITEMS = [
  { label: "Healthy", color: "#22c55e", ring: "#bbf7d0" },
  { label: "Low Stock", color: "#eab308", ring: "#fef08a" },
  { label: "Critical", color: "#ef4444", ring: "#fecaca" },
];

export default function Legend({ productCounts }: Props) {
  const statusCounts = [productCounts.healthy, productCounts.low, productCounts.critical];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Stock Status
      </h3>
      <div className="space-y-2.5">
        {STATUS_ITEMS.map((item, i) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-5 h-5 rounded-full border-2"
                style={{
                  backgroundColor: item.ring,
                  borderColor: item.color,
                }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">{item.label}</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {statusCounts[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Action indicators */}
      {(productCounts.needsRestock > 0 || productCounts.needsReorder > 0) && (
        <>
          <div className="border-t border-slate-100 mt-3 pt-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
              Actions Needed
            </h3>
            <div className="space-y-2">
              {productCounts.needsRestock > 0 && (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">
                      Needs Restock
                    </p>
                    <p className="text-[10px] text-slate-400">Back → Front</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {productCounts.needsRestock}
                  </span>
                </div>
              )}
              {productCounts.needsReorder > 0 && (
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <PackagePlus className="w-3 h-3 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">
                      Needs Reorder
                    </p>
                    <p className="text-[10px] text-slate-400">From supplier</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {productCounts.needsReorder}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
