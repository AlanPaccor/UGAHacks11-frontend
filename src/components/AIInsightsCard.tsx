import { useState } from "react";
import { BrainCircuit, RefreshCw, Sparkles, Clock } from "lucide-react";
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

  // Parse markdown-like sections from the analysis text
  const renderAnalysis = (text: string | undefined | null) => {
    if (!text) return <p className="text-sm text-gray-500">No analysis available.</p>;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold headers (** **)
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h4
            key={i}
            className="text-sm font-bold text-gray-800 mt-4 mb-1 first:mt-0"
          >
            {line.replace(/\*\*/g, "")}
          </h4>
        );
      }
      // Bullet points
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-sm text-gray-600 ml-4 list-disc">
            {line.slice(2).replace(/\*\*/g, "")}
          </li>
        );
      }
      // Empty lines
      if (line.trim() === "") return <div key={i} className="h-2" />;
      // Regular text
      return (
        <p key={i} className="text-sm text-gray-600">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto mb-8">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            🤖 AI-Powered Insights
            <span className="text-xs font-normal text-purple-400 ml-1">
              Gemini
            </span>
          </h2>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            {loading
              ? "Analyzing…"
              : insights
              ? "Refresh Analysis"
              : "Generate Insights"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !insights && (
          <div className="flex flex-col items-center py-10 gap-3">
            <BrainCircuit className="w-10 h-10 text-purple-400 animate-pulse" />
            <p className="text-purple-500 text-sm animate-pulse">
              Gemini is analyzing your inventory data…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !insights && !error && (
          <div className="flex flex-col items-center py-8 gap-3 text-center">
            <BrainCircuit className="w-10 h-10 text-gray-300" />
            <p className="text-gray-400 text-sm max-w-md">
              Click <strong>"Generate Insights"</strong> to have Gemini AI
              analyze your transaction history, identify patterns, and provide
              actionable recommendations.
            </p>
          </div>
        )}

        {/* Insights Content */}
        {insights && (
          <div className="space-y-2">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(insights.timestamp).toLocaleString()}
              </span>
              <span>
                📦 {insights.productCount} products analyzed
              </span>
              <span>
                📊 {insights.transactionCount} transactions reviewed
              </span>
            </div>

            {/* Analysis content */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-0.5">
              {renderAnalysis(insights.analysis)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
