import { Eye, EyeOff, Flame, Layers, ArrowRightLeft, PackagePlus } from "lucide-react";

export interface FilterState {
  showCriticalOnly: boolean;
  showHeatmap: boolean;
  selectedZone: string;
  showNeedsRestock: boolean;
  showNeedsReorder: boolean;
}

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  zones: string[];
}

export default function FloorFilters({ filters, onChange, zones }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Filters
      </h3>

      {/* Critical only toggle */}
      <button
        onClick={() =>
          onChange({ ...filters, showCriticalOnly: !filters.showCriticalOnly })
        }
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
          filters.showCriticalOnly
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        {filters.showCriticalOnly ? (
          <Eye className="w-3.5 h-3.5" />
        ) : (
          <EyeOff className="w-3.5 h-3.5" />
        )}
        Critical only
      </button>

      {/* Needs Restock filter */}
      <button
        onClick={() =>
          onChange({ ...filters, showNeedsRestock: !filters.showNeedsRestock })
        }
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
          filters.showNeedsRestock
            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        Needs restock
      </button>

      {/* Needs Reorder filter */}
      <button
        onClick={() =>
          onChange({ ...filters, showNeedsReorder: !filters.showNeedsReorder })
        }
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
          filters.showNeedsReorder
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <PackagePlus className="w-3.5 h-3.5" />
        Needs reorder
      </button>

      {/* Heatmap toggle */}
      <button
        onClick={() =>
          onChange({ ...filters, showHeatmap: !filters.showHeatmap })
        }
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
          filters.showHeatmap
            ? "bg-orange-50 border-orange-200 text-orange-700"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Flame className="w-3.5 h-3.5" />
        Urgency heatmap
      </button>

      {/* Zone filter */}
      <div>
        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
          <Layers className="w-3 h-3 inline mr-1" />
          Zone
        </label>
        <select
          value={filters.selectedZone}
          onChange={(e) =>
            onChange({ ...filters, selectedZone: e.target.value })
          }
          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="ALL">All zones</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
