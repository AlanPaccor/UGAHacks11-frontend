interface Props {
  productCounts: { healthy: number; low: number; critical: number };
}

const ITEMS = [
  { label: "Healthy", color: "#22c55e", ring: "#bbf7d0" },
  { label: "Low Stock", color: "#eab308", ring: "#fef08a" },
  { label: "Critical", color: "#ef4444", ring: "#fecaca" },
];

export default function Legend({ productCounts }: Props) {
  const counts = [productCounts.healthy, productCounts.low, productCounts.critical];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Stock Status
      </h3>
      <div className="space-y-2.5">
        {ITEMS.map((item, i) => (
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
              {counts[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
