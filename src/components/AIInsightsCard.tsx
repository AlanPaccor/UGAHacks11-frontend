import { useState } from "react";
import { BrainCircuit, RefreshCw, Sparkles, Clock, Package, BarChart3 } from "lucide-react";
import { getAIInsights } from "../services/api";
import type { AIInsights } from "../types/AIInsights";

export default function AIInsightsCard() {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAIInsights();
      setInsights(res.data);
    } catch {
      setError("Failed to fetch AI insights. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysis = (text: string | undefined | null) => {
    if (!text)
      return (
        <p className="text-sm text-slate-500">No analysis available.</p>
      );
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h4
            key={i}
            className="text-sm font-semibold text-slate-900 mt-4 mb-1 first:mt-0"
          >
            {line.replace(/\*\*/g, "")}
          </h4>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-sm text-slate-600 ml-4 list-disc leading-relaxed">
            {line.slice(2).replace(/\*\*/g, "")}
          </li>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm text-slate-600 leading-relaxed">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    });
  };

  return (
    <section>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              AI Insights
            </h2>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide font-medium">
              Gemini
            </span>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            {loading
              ? "Analyzing..."
              : insights
              ? "Refresh"
              : "Generate Insights"}
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && !insights && (
            <div className="flex flex-col items-center py-10 gap-3">
              <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
              <p className="text-sm text-slate-500">
                Analyzing inventory data...
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && !insights && !error && (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <BrainCircuit className="w-8 h-8 text-slate-300" />
              <p className="text-sm text-slate-400 max-w-md">
                Generate AI-powered analysis of your transaction history, 
                inventory patterns, and actionable recommendations.
              </p>
            </div>
          )}

          {/* Content */}
          {insights && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(insights.timestamp).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {insights.productCount} products
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {insights.transactionCount} transactions
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-0.5">
                {renderAnalysis(insights.analysis)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
