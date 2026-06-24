import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { Gift, Filter } from "lucide-react";
import { StatusBadge } from "../components/Badges";

export default function FreeModels() {
  const { data: freeData, loading } = useApi("/api/free-models");
  const [filter, setFilter] = useState("all"); // 'all', 'online', 'offline'

  if (loading)
    return (
      <div className="text-[#66fcf1] animate-pulse">
        Loading free models discovery...
      </div>
    );

  if (!freeData || !freeData.models) {
    return (
      <div className="card text-center py-12">
        <Gift className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">
          No free models data available. Run 'npm run models:free' first.
        </p>
      </div>
    );
  }

  const models = freeData.models || [];
  const filteredModels = models.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#45a29e]/20 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-[#66fcf1]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              Free Models Discovery
            </h2>
            <p className="text-sm text-gray-400">
              100% Free LLMs found on OpenRouter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#1f2833] p-1 rounded-lg border border-[#45a29e]/20">
          <Filter className="w-4 h-4 text-gray-500 ml-2" />
          <select
            className="bg-transparent border-none text-sm text-gray-300 focus:ring-0 cursor-pointer p-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Models ({models.length})</option>
            <option value="online">
              Online ({models.filter((m) => m.status === "online").length})
            </option>
            <option value="offline">
              Offline ({models.filter((m) => m.status === "offline").length})
            </option>
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto p-0 mt-8">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1f2833]/50 text-xs uppercase font-semibold text-gray-400 border-b border-[#45a29e]/20">
            <tr>
              <th className="px-6 py-4">Model</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Latency</th>
              <th className="px-6 py-4">TTFB</th>
              <th className="px-6 py-4">TPS</th>
              <th className="px-6 py-4">Error (if offline)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#45a29e]/10">
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No models match the current filter.
                </td>
              </tr>
            ) : (
              filteredModels.map((m) => (
                <tr
                  key={m.model}
                  className={`hover:bg-[#45a29e]/5 transition-colors ${m.status === "offline" ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-gray-100">
                    {m.model.split("/").pop()}
                  </td>
                  <td className="px-6 py-4 uppercase text-xs text-gray-400">
                    {m.provider}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {m.latency > 0 ? `${m.latency}ms` : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {m.ttfb > 0 ? `${m.ttfb}ms` : "N/A"}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {m.tps > 0 ? m.tps : "N/A"}
                  </td>
                  <td
                    className="px-6 py-4 text-xs text-red-400 max-w-[200px] truncate"
                    title={m.error || ""}
                  >
                    {m.error || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
