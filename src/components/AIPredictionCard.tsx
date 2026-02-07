import { useEffect, useState } from "react";
import { BrainCircuit, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { getTransactionsByBarcode } from "../services/api";
import type { Product } from "../types/Product";
import type { Transaction } from "../types/Transaction";

interface Props {
  product: Product;
}

export default function AIPredictionCard({ product }: Props) {
  const [daysUntilEmpty, setDaysUntilEmpty] = useState<number | null>(null);
  const [avgDailySales, setAvgDailySales] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getTransactionsByBarcode(product.barcode)
      .then((res) => {
        if (cancelled) return;
        const transactions: Transaction[] = res.data;
        const checkouts = transactions.filter(
          (t) => t.transactionType === "CHECKOUT"
        );

        if (checkouts.length < 2) {
          setDaysUntilEmpty(null);
          setAvgDailySales(0);
          setLoading(false);
          return;
        }

        const oldest = new Date(checkouts[checkouts.length - 1].createdAt);
        const newest = new Date(checkouts[0].createdAt);
        const daysCovered =
          (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24);

        const totalSold = checkouts.reduce(
          (sum, t) => sum + Math.abs(t.quantity),
          0
        );

        if (daysCovered > 0) {
          const daily = totalSold / daysCovered;
          setAvgDailySales(daily);
          const currentStock = product.frontQuantity + product.backQuantity;
          setDaysUntilEmpty(daily > 0 ? Math.floor(currentStock / daily) : null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [product]);

  if (loading) return null;

  if (daysUntilEmpty === null) {
    return (
      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
        <BrainCircuit className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-400">
          Insufficient sales data for prediction.
        </p>
      </div>
    );
  }

  const isUrgent = daysUntilEmpty <= 3;
  const isWarning = daysUntilEmpty <= 7;

  return (
    <div
      className={`mt-3 rounded-lg p-3 flex items-start gap-2 border ${
        isUrgent
          ? "bg-red-50 border-red-200"
          : isWarning
          ? "bg-amber-50 border-amber-200"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <BrainCircuit
        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
          isUrgent
            ? "text-red-500"
            : isWarning
            ? "text-amber-500"
            : "text-indigo-500"
        }`}
      />
      <div className="text-[11px] space-y-0.5">
        <p
          className={`font-semibold ${
            isUrgent
              ? "text-red-700"
              : isWarning
              ? "text-amber-700"
              : "text-slate-700"
          }`}
        >
          AI Forecast
        </p>
        <p className="text-slate-500">
          Avg. velocity: <strong>{avgDailySales.toFixed(1)}</strong> units/day
        </p>
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
            {daysUntilEmpty === 0
              ? "Depleted today — immediate restock required"
              : `~${daysUntilEmpty} day${daysUntilEmpty !== 1 ? "s" : ""} until depletion`}
          </span>
        </p>
        {isUrgent && (
          <p className="text-red-600 font-medium">
            Recommended: restock {Math.ceil(avgDailySales * 7)} units for 7-day coverage.
          </p>
        )}
      </div>
    </div>
  );
}
