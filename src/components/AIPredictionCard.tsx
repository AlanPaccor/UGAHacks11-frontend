import { useEffect, useState } from "react";
import {
  BrainCircuit,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Trash2,
  PackageOpen,
  AlertCircle,
} from "lucide-react";
import { getTransactionsByBarcode } from "../services/api";
import type { Product } from "../types/Product";
import type { Transaction } from "../types/Transaction";

interface Props {
  product: Product;
}

interface Stats {
  totalCheckouts: number;
  totalRestocks: number;
  totalWaste: number;
  totalReceived: number;
  checkoutVelocity: number | null; // units/day
  daysUntilEmpty: number | null;
  wasteRate: number | null; // percentage
  daysCovered: number;
}

function computeStats(
  transactions: Transaction[],
  product: Product
): Stats {
  const checkouts = transactions.filter((t) => t.transactionType === "CHECKOUT");
  const restocks = transactions.filter((t) => t.transactionType === "RESTOCK");
  const waste = transactions.filter((t) => t.transactionType === "WASTE");
  const received = transactions.filter((t) => t.transactionType === "RECEIVE");

  const totalCheckouts = checkouts.reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalRestocks = restocks.reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalWaste = waste.reduce((s, t) => s + Math.abs(t.quantity), 0);
  const totalReceived = received.reduce((s, t) => s + Math.abs(t.quantity), 0);

  // Calculate date range across ALL transactions
  const allDates = transactions.map((t) => new Date(t.createdAt).getTime());
  const oldest = Math.min(...allDates);
  const newest = Math.max(...allDates);
  const daysCovered = Math.max(
    (newest - oldest) / (1000 * 60 * 60 * 24),
    1 // minimum 1 day to avoid division by zero
  );

  // Checkout velocity (if we have checkout data)
  let checkoutVelocity: number | null = null;
  let daysUntilEmpty: number | null = null;

  if (totalCheckouts > 0) {
    checkoutVelocity = totalCheckouts / daysCovered;
    const currentStock = product.frontQuantity + product.backQuantity;
    daysUntilEmpty =
      checkoutVelocity > 0 ? Math.floor(currentStock / checkoutVelocity) : null;
  }

  // Waste rate = waste / (checkouts + waste + current stock on hand)
  const totalThroughput = totalCheckouts + totalWaste;
  const wasteRate = totalThroughput > 0 ? (totalWaste / totalThroughput) * 100 : null;

  return {
    totalCheckouts,
    totalRestocks,
    totalWaste,
    totalReceived,
    checkoutVelocity,
    daysUntilEmpty,
    wasteRate,
    daysCovered,
  };
}

export default function AIPredictionCard({ product }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [txCount, setTxCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getTransactionsByBarcode(product.barcode)
      .then((res) => {
        if (cancelled) return;
        const transactions: Transaction[] = res.data;
        setTxCount(transactions.length);

        if (transactions.length === 0) {
          setStats(null);
        } else {
          setStats(computeStats(transactions, product));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  if (loading) return null;

  // API error
  if (error) {
    return (
      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-red-500">
          Unable to load transaction data.
        </p>
      </div>
    );
  }

  // No transactions at all
  if (!stats || txCount === 0) {
    return (
      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <BrainCircuit className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-400">
          No transaction history yet.
        </p>
      </div>
    );
  }

  // Determine urgency
  const isUrgent = stats.daysUntilEmpty !== null && stats.daysUntilEmpty <= 3;
  const isWarning = stats.daysUntilEmpty !== null && stats.daysUntilEmpty <= 7;
  const highWaste = stats.wasteRate !== null && stats.wasteRate > 15;

  const borderColor = isUrgent
    ? "bg-red-50 border-red-200"
    : isWarning || highWaste
    ? "bg-amber-50 border-amber-200"
    : "bg-slate-50 border-slate-200";

  const iconColor = isUrgent
    ? "text-red-500"
    : isWarning || highWaste
    ? "text-amber-500"
    : "text-indigo-500";

  return (
    <div className={`mt-3 rounded-lg p-3 border ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <BrainCircuit className={`w-3.5 h-3.5 ${iconColor}`} />
        <span
          className={`text-[11px] font-semibold ${
            isUrgent
              ? "text-red-700"
              : isWarning || highWaste
              ? "text-amber-700"
              : "text-slate-700"
          }`}
        >
          AI Forecast
        </span>
        <span className="text-[10px] text-slate-400 ml-auto">
          {txCount} txn{txCount !== 1 ? "s" : ""} · {Math.round(stats.daysCovered)}d range
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        {stats.totalCheckouts > 0 && (
          <div className="bg-white/70 rounded-md px-2 py-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <ShoppingCart className="w-3 h-3 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              {stats.totalCheckouts}
            </p>
            <p className="text-[9px] text-slate-400">Sold</p>
          </div>
        )}
        {stats.totalRestocks + stats.totalReceived > 0 && (
          <div className="bg-white/70 rounded-md px-2 py-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <PackageOpen className="w-3 h-3 text-amber-500" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              {stats.totalRestocks + stats.totalReceived}
            </p>
            <p className="text-[9px] text-slate-400">Stocked</p>
          </div>
        )}
        {stats.totalWaste > 0 && (
          <div className="bg-white/70 rounded-md px-2 py-1.5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Trash2 className="w-3 h-3 text-red-500" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              {stats.totalWaste}
            </p>
            <p className="text-[9px] text-slate-400">Discarded</p>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="space-y-1 text-[11px]">
        {/* Checkout velocity & depletion */}
        {stats.checkoutVelocity !== null && (
          <p className="text-slate-500">
            Sales velocity:{" "}
            <strong className="text-slate-700">
              {stats.checkoutVelocity.toFixed(1)}
            </strong>{" "}
            units/day
          </p>
        )}

        {stats.daysUntilEmpty !== null && (
          <p className="flex items-center gap-1">
            {isUrgent ? (
              <AlertTriangle className="w-3 h-3 text-red-500" />
            ) : isWarning ? (
              <TrendingDown className="w-3 h-3 text-amber-500" />
            ) : (
              <CheckCircle className="w-3 h-3 text-emerald-500" />
            )}
            <span
              className={
                isUrgent
                  ? "text-red-600 font-semibold"
                  : isWarning
                  ? "text-amber-600 font-semibold"
                  : "text-slate-600"
              }
            >
              {stats.daysUntilEmpty === 0
                ? "Depleted today — immediate restock required"
                : `~${stats.daysUntilEmpty} day${stats.daysUntilEmpty !== 1 ? "s" : ""} until depletion`}
            </span>
          </p>
        )}

        {/* Waste rate */}
        {stats.wasteRate !== null && (
          <p className="flex items-center gap-1">
            {highWaste ? (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            ) : (
              <CheckCircle className="w-3 h-3 text-emerald-500" />
            )}
            <span
              className={highWaste ? "text-amber-600 font-semibold" : "text-slate-500"}
            >
              Waste rate: {stats.wasteRate.toFixed(1)}%
              {highWaste ? " — above optimal threshold" : ""}
            </span>
          </p>
        )}

        {/* Urgent restock recommendation */}
        {isUrgent && stats.checkoutVelocity && (
          <p className="text-red-600 font-medium pt-0.5">
            Recommended: restock{" "}
            {Math.ceil(stats.checkoutVelocity * 7)} units for 7-day coverage.
          </p>
        )}
      </div>
    </div>
  );
}
