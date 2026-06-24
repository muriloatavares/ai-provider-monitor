import { useApi } from "../hooks/useApi";
import { Box, Zap, DollarSign, Activity, Hash, Trophy } from "lucide-react";
import { HealthBadge } from "../components/Badges";

export default function Models() {
  const { data: models, loading } = useApi("/api/models");

  if (loading)
    return (
      <div className="text-[#66fcf1] animate-pulse">Loading models...</div>
    );

  if (!models || models.length === 0) {
    return (
      <div className="card text-center py-12">
        <Box className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">
          No benchmark data available. Run benchmarks to generate intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#45a29e]/20 pb-4">
        <Box className="w-8 h-8 text-[#66fcf1]" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Models Catalog</h2>
          <p className="text-sm text-gray-400">
            Detailed intelligence cards for all monitored LLMs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {models.map((m) => (
          <div
            key={m.model}
            className="card hover:border-[#66fcf1]/50 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-[#45a29e]/20 text-[#66fcf1] rounded">
                    #{m.rank}
                  </span>
                  <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                    {m.provider}
                  </span>
                </div>
                <h3
                  className="font-bold text-lg text-gray-100 group-hover:text-[#66fcf1] transition-colors truncate max-w-[200px]"
                  title={m.model}
                >
                  {m.model.split("/").pop()}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[#66fcf1]">
                  {Math.round(m.overallScore)}
                </div>
                <div className="text-[10px] text-gray-500 uppercase">
                  Overall
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 bg-[#0b0c10]/50 p-3 rounded-lg border border-[#1f2833]">
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Latency
                </div>
                <div className="font-mono text-sm text-gray-200">
                  {m.metrics.avgLatency}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> TTFB
                </div>
                <div className="font-mono text-sm text-gray-200">
                  {m.metrics.avgTTFB}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> TPS
                </div>
                <div className="font-mono text-sm text-gray-200">
                  {m.metrics.avgTPS}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Cost / 1M
                </div>
                <div className="font-mono text-sm text-gray-200">
                  ${m.metrics.costPer1M.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Health:</span>
                <HealthBadge score={m.reliabilityScore} />
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Hash className="w-3 h-3" />
                {m.metrics.benchmarkRuns} runs
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
