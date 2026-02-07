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
  Activity,
  ShoppingCart,
  PackageOpen,
  Trash2,
  Clock,
} from "lucide-react";
import { getRecentTransactions } from "../services/api";
import type { Transaction } from "../types/Transaction";
import type { Product } from "../types/Product";

interface Props {
  products: Product[];
}

const TYPE_COLORS: Record<string, string> = {
  CHECKOUT: "#3b82f6",
  RESTOCK: "#f59e0b",
  WASTE: "#ef4444",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  CHECKOUT: <ShoppingCart className="w-4 h-4" />,
  RESTOCK: <PackageOpen className="w-4 h-4" />,
  WASTE: <Trash2 className="w-4 h-4" />,
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
  }, [products]); // re-fetch when products change (after a transaction)

  // ── derived data ──

  // Inventory overview bar chart (per product: front vs back)
  const inventoryData = products.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    Front: p.frontQuantity,
    Back: p.backQuantity,
    Waste: p.wasteQuantity,
  }));

  // Transaction type breakdown for pie chart
  const typeCounts = transactions.reduce(
    (acc, t) => {
      acc[t.transactionType] = (acc[t.transactionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Summary stats
  const totalCheckouts = transactions
    .filter((t) => t.transactionType === "CHECKOUT")
    .reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalRestocks = transactions
    .filter((t) => t.transactionType === "RESTOCK")
    .reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalWaste = transactions
    .filter((t) => t.transactionType === "WASTE")
    .reduce((s, t) => s + Math.abs(t.quantity), 0);

  // Low-stock alerts
  const lowStockProducts = products.filter(
    (p) => p.frontQuantity + p.backQuantity <= p.reorderThreshold
  );

  return (
    <div className="max-w-5xl mx-auto mb-12 space-y-6">
      {/* ── Section Header ── */}
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Activity className="w-6 h-6 text-blue-500" />
        Analytics Dashboard
      </h2>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <ShoppingCart className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{totalCheckouts}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Items Sold
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <PackageOpen className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{totalRestocks}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Restocked
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Trash2 className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{totalWaste}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Wasted
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Activity className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">
            {transactions.length}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Transactions
          </p>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Levels Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
            Inventory Levels by Product
          </h3>
          {inventoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={inventoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Front" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Back" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Waste" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">
              No products yet.
            </p>
          )}
        </div>

        {/* Transaction Breakdown Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
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
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TYPE_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">
              No transactions yet.
            </p>
          )}
        </div>
      </div>

      {/* ── Low Stock Alerts ── */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            ⚠️ Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div
                key={p.barcode}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {p.frontQuantity + p.backQuantity} total (threshold:{" "}
                    {p.reorderThreshold})
                  </p>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  Restock Now
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Activity Feed ── */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h3>
        {loading ? (
          <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {transactions.slice(0, 20).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <span
                  className="p-1.5 rounded-lg"
                  style={{
                    backgroundColor:
                      TYPE_COLORS[t.transactionType] + "20",
                    color: TYPE_COLORS[t.transactionType],
                  }}
                >
                  {TYPE_ICONS[t.transactionType]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 truncate">
                    <span className="font-medium">{t.transactionType}</span>
                    {": "}
                    {t.productName}{" "}
                    <span
                      className={
                        t.quantity < 0 ? "text-red-500" : "text-green-500"
                      }
                    >
                      ({t.quantity > 0 ? "+" : ""}
                      {t.quantity})
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {timeAgo(t.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
