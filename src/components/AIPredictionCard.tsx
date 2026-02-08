import { useEffect, useState } from "react";
import {
  BrainCircuit,

  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Trash2,
  PackageOpen,
  AlertCircle,
  ArrowRightLeft,
  PackagePlus,
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
  checkoutVelocity: number | null;
  daysUntilFrontEmpty: number | null;
  daysUntilBackEmpty: number | null;
  wasteRate: number | null;
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

  const allDates = transactions.map((t) => new Date(t.createdAt).getTime());
  const oldest = Math.min(...allDates);
  const newest = Math.max(...allDates);
  const daysCovered = Math.max(
    (newest - oldest) / (1000 * 60 * 60 * 24),
    1
  );

  // Checkout velocity — front stock is depleted by sales
  let checkoutVelocity: number | null = null;
  let daysUntilFrontEmpty: number | null = null;

  if (totalCheckouts > 0) {
    checkoutVelocity = totalCheckouts / daysCovered;
    daysUntilFrontEmpty =
      checkoutVelocity > 0
        ? Math.floor(product.frontQuantity / checkoutVelocity)
        : null;
  }

  // Back stock depletion — restocks move back→front, so back depletes at restock rate
  let daysUntilBackEmpty: number | null = null;
  if (totalRestocks > 0) {
    const restockVelocity = totalRestocks / daysCovered;
    daysUntilBackEmpty =
      restockVelocity > 0
        ? Math.floor(product.backQuantity / restockVelocity)
        : null;
  }

  const totalThroughput = totalCheckouts + totalWaste;
  const wasteRate = totalThroughput > 0 ? (totalWaste / totalThroughput) * 100 : null;

  return {
    totalCheckouts,
    totalRestocks,
    totalWaste,
    totalReceived,
    checkoutVelocity,
    daysUntilFrontEmpty,
    daysUntilBackEmpty,
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

  // ── Front stock analysis ──
  // Front is low if it drops to or below the reorder threshold
  const frontLow = product.frontQuantity <= product.reorderThreshold;
  const frontCritical = product.frontQuantity <= Math.ceil(product.reorderThreshold * 0.5);
  const frontHasBackup = product.backQuantity > 0;

  // ── Back stock analysis ──
  // Back is low if it drops to or below the reorder threshold
  const backLow = product.backQuantity <= product.reorderThreshold;
  const backCritical = product.backQuantity <= Math.ceil(product.reorderThreshold * 0.5);

  // Overall urgency for card styling
  const hasAnyUrgency = frontCritical || backCritical;
  const hasAnyWarning = frontLow || backLow;
  const highWaste = stats.wasteRate !== null && stats.wasteRate > 15;

  const borderColor = hasAnyUrgency
    ? "bg-red-50 border-red-200"
    : hasAnyWarning || highWaste
    ? "bg-amber-50 border-amber-200"
    : "bg-slate-50 border-slate-200";

  const iconColor = hasAnyUrgency
    ? "text-red-500"
    : hasAnyWarning || highWaste
    ? "text-amber-500"
    : "text-indigo-500";

  const headerColor = hasAnyUrgency
    ? "text-red-700"
    : hasAnyWarning || highWaste
    ? "text-amber-700"
    : "text-slate-700";

  return (
    <div className={`mt-3 rounded-lg p-3 border ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <BrainCircuit className={`w-3.5 h-3.5 ${iconColor}`} />
        <span className={`text-[11px] font-semibold ${headerColor}`}>
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

      {/* ── Front Store Status ── */}
      <div className="space-y-1.5 text-[11px]">
        <div className={`rounded-md px-2.5 py-2 ${
          frontCritical
            ? "bg-red-100/60"
            : frontLow
            ? "bg-amber-100/60"
            : "bg-emerald-100/40"
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShoppingCart className={`w-3 h-3 ${
              frontCritical ? "text-red-500" : frontLow ? "text-amber-500" : "text-emerald-500"
            }`} />
            <span className="font-semibold text-slate-700">Front Shelves</span>
            <span className={`ml-auto text-[10px] font-bold ${
              frontCritical ? "text-red-600" : frontLow ? "text-amber-600" : "text-emerald-600"
            }`}>
              {product.frontQuantity} units
            </span>
          </div>
          {frontCritical ? (
            <div className="flex items-start gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <span className="text-red-600 font-semibold">
                Critically low — {frontHasBackup
                  ? `restock from back storage immediately (${product.backQuantity} available)`
                  : "no back stock available, reorder from supplier"}
              </span>
            </div>
          ) : frontLow ? (
            <div className="flex items-start gap-1 mt-1">
              <ArrowRightLeft className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-600 font-semibold">
                Running low — {frontHasBackup
                  ? `restock from back storage (${product.backQuantity} available)`
                  : "no back stock, consider reordering"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="text-slate-500">Shelves well-stocked</span>
            </div>
          )}
          {stats.daysUntilFrontEmpty !== null && stats.checkoutVelocity !== null && (
            <p className="text-slate-500 mt-0.5 pl-4">
              At {stats.checkoutVelocity.toFixed(1)} sales/day, front shelves empty in ~{stats.daysUntilFrontEmpty} day{stats.daysUntilFrontEmpty !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Back Storage Status ── */}
        <div className={`rounded-md px-2.5 py-2 ${
          backCritical
            ? "bg-red-100/60"
            : backLow
            ? "bg-amber-100/60"
            : "bg-emerald-100/40"
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <PackageOpen className={`w-3 h-3 ${
              backCritical ? "text-red-500" : backLow ? "text-amber-500" : "text-emerald-500"
            }`} />
            <span className="font-semibold text-slate-700">Back Storage</span>
            <span className={`ml-auto text-[10px] font-bold ${
              backCritical ? "text-red-600" : backLow ? "text-amber-600" : "text-emerald-600"
            }`}>
              {product.backQuantity} units
            </span>
          </div>
          {backCritical ? (
            <div className="flex items-start gap-1 mt-1">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <span className="text-red-600 font-semibold">
                Critically low — reorder from supplier immediately
              </span>
            </div>
          ) : backLow ? (
            <div className="flex items-start gap-1 mt-1">
              <PackagePlus className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-600 font-semibold">
                Running low — place a supplier reorder soon
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="text-slate-500">Storage well-stocked</span>
            </div>
          )}
          {stats.daysUntilBackEmpty !== null && (
            <p className="text-slate-500 mt-0.5 pl-4">
              At current restock rate, back storage empty in ~{stats.daysUntilBackEmpty} day{stats.daysUntilBackEmpty !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Waste Rate ── */}
        {stats.wasteRate !== null && (
          <p className="flex items-center gap-1 pt-0.5">
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

        {/* ── Recommended action summary ── */}
        {(frontLow || backLow) && stats.checkoutVelocity && (
          <div className="border-t border-slate-200/50 pt-1.5 mt-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-0.5">
              Recommended Action
            </p>
            {frontLow && frontHasBackup && (
              <p className="text-indigo-600 font-medium flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />
                Restock shelves: move {Math.min(
                  Math.ceil(stats.checkoutVelocity * 7),
                  product.backQuantity
                )} units from back to front for 7-day cover
              </p>
            )}
            {backLow && (
              <p className="text-amber-600 font-medium flex items-center gap-1">
                <PackagePlus className="w-3 h-3" />
                Reorder: order ~{Math.ceil(stats.checkoutVelocity * 14)} units from supplier for 2-week cover
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
