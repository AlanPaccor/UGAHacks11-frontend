import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  ShoppingCart,
  PackageOpen,
  Trash2,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getRecentTransactions } from "../services/api";
import type { Transaction } from "../types/Transaction";
import type { Product } from "../types/Product";

interface Props {
  products: Product[];
}

const TYPE_COLORS: Record<string, string> = {
  CHECKOUT: "#6366f1",
  RESTOCK: "#f59e0b",
  WASTE: "#ef4444",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  CHECKOUT: <ShoppingCart className="w-4 h-4" />,
  RESTOCK: <PackageOpen className="w-4 h-4" />,
  WASTE: <Trash2 className="w-4 h-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  CHECKOUT: "Sale",
  RESTOCK: "Restock",
  WASTE: "Discard",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AnalyticsDashboard({ products }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentTransactions()
      .then((res) => setTransactions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [products]);

  const inventoryData = products.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name,
    Front: p.frontQuantity,
    Back: p.backQuantity,
    Discard: p.wasteQuantity,
  }));

  const typeCounts = transactions.reduce(
    (acc, t) => {
      acc[t.transactionType] = (acc[t.transactionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(typeCounts).map(([name, value]) => ({
    name: TYPE_LABELS[name] || name,
    value,
    key: name,
  }));

  const totalCheckouts = transactions
    .filter((t) => t.transactionType === "CHECKOUT")
    .reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalRestocks = transactions
    .filter((t) => t.transactionType === "RESTOCK")
    .reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalWaste = transactions
    .filter((t) => t.transactionType === "WASTE")
    .reduce((s, t) => s + Math.abs(t.quantity), 0);

  const lowStockProducts = products.filter(
    (p) => p.frontQuantity + p.backQuantity <= p.reorderThreshold
  );

  return (
    <section className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">
          Analytics
        </h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <ShoppingCart className="w-4 h-4" />,
            value: totalCheckouts,
            label: "Units Sold",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            icon: <PackageOpen className="w-4 h-4" />,
            value: totalRestocks,
            label: "Restocked",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            icon: <Trash2 className="w-4 h-4" />,
            value: totalWaste,
            label: "Discarded",
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            icon: <Activity className="w-4 h-4" />,
            value: transactions.length,
            label: "Transactions",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`${stat.bg} ${stat.color} p-1.5 rounded-lg`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">
            Inventory Levels by Product
          </h3>
          {inventoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={inventoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Front" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Back" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Discard" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-10">
              No product data available.
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide">
            Transaction Breakdown
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(props: any) =>
                    `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={TYPE_COLORS[entry.key] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-10">
              No transactions recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-red-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div
                key={p.barcode}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-red-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-400">
                    {p.frontQuantity + p.backQuantity} total units — threshold: {p.reorderThreshold}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Reorder
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Recent Activity
        </h3>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {transactions.slice(0, 20).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <span
                  className="p-1.5 rounded-lg"
                  style={{
                    backgroundColor: TYPE_COLORS[t.transactionType] + "15",
                    color: TYPE_COLORS[t.transactionType],
                  }}
                >
                  {TYPE_ICONS[t.transactionType]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 truncate text-sm">
                    <span className="font-medium">
                      {TYPE_LABELS[t.transactionType] || t.transactionType}
                    </span>
                    {" — "}
                    {t.productName}{" "}
                    <span
                      className={
                        t.quantity < 0 ? "text-red-500" : "text-emerald-600"
                      }
                    >
                      ({t.quantity > 0 ? "+" : ""}
                      {t.quantity})
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">{t.location}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {timeAgo(t.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
