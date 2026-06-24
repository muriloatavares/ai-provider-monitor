import { useApi } from "../hooks/useApi";
import {
  Trophy,
  Zap,
  DollarSign,
  ShieldCheck,
  Activity,
  Timer,
} from "lucide-react";
import { HealthBadge } from "../components/Badges";

function WinnerCard({ title, modelName, score, icon: Icon, colorClass }) {
  return (
    <div className={`card border-t-4 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3
            className="text-lg font-bold text-gray-100 truncate max-w-[150px]"
            title={modelName}
          >
            {modelName ? modelName.split("/").pop() : "N/A"}
          </h3>
          <p className="text-sm font-mono mt-2 text-gray-300">{score}</p>
        </div>
        <div className={`p-2 rounded-lg bg-[#0b0c10]/50`}>
          <Icon className={`w-5 h-5`} />
        </div>
      </div>
    </div>
  );
}

export default function Rankings() {
  const { data: models, loading } = useApi("/api/rankings");

  if (loading)
    return (
      <div className="text-[#66fcf1] animate-pulse">
        Loading intelligence rankings...
      </div>
    );

  if (!models || models.length === 0) {
    return (
      <div className="card text-center py-12">
        <Trophy className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">No benchmark data available.</p>
      </div>
    );
  }

  // Find winners
  const bestOverall = [...models].sort(
    (a, b) => b.overallScore - a.overallScore,
  )[0];
  const fastest = [...models].sort(
    (a, b) => a.metrics.avgTTFB - b.metrics.avgTTFB,
  )[0];
  const cheapest = [...models].sort(
    (a, b) => a.metrics.costPer1M - b.metrics.costPer1M,
  )[0];
  const reliable = [...models].sort(
    (a, b) => b.reliabilityScore - a.reliabilityScore,
  )[0];
  const highestTps = [...models].sort(
    (a, b) => b.metrics.avgTPS - a.metrics.avgTPS,
  )[0];
  const lowestLatency = [...models].sort(
    (a, b) => a.metrics.avgLatency - b.metrics.avgLatency,
  )[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#45a29e]/20 pb-4">
        <Trophy className="w-8 h-8 text-[#66fcf1]" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            Intelligence Rankings
          </h2>
          <p className="text-sm text-gray-400">
            Multi-dimensional evaluation of LLM models
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <WinnerCard
          title="Best Overall"
          modelName={bestOverall?.model}
          score={`Score: ${bestOverall?.overallScore}`}
          icon={Trophy}
          colorClass="border-t-[#66fcf1]"
        />
        <WinnerCard
          title="Fastest TTFB"
          modelName={fastest?.model}
          score={`${fastest?.metrics.avgTTFB}ms`}
          icon={Zap}
          colorClass="border-t-amber-400"
        />
        <WinnerCard
          title="Cheapest"
          modelName={cheapest?.model}
          score={`$${cheapest?.metrics.costPer1M.toFixed(4)}/1M`}
          icon={DollarSign}
          colorClass="border-t-emerald-400"
        />
        <WinnerCard
          title="Most Reliable"
          modelName={reliable?.model}
          score={`Health: ${reliable?.reliabilityScore}`}
          icon={ShieldCheck}
          colorClass="border-t-blue-400"
        />
        <WinnerCard
          title="Highest TPS"
          modelName={highestTps?.model}
          score={`${highestTps?.metrics.avgTPS} tps`}
          icon={Activity}
          colorClass="border-t-purple-400"
        />
        <WinnerCard
          title="Lowest Latency"
          modelName={lowestLatency?.model}
          score={`${lowestLatency?.metrics.avgLatency}ms`}
          icon={Timer}
          colorClass="border-t-pink-400"
        />
      </div>

      <div className="card overflow-x-auto p-0 mt-8">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1f2833]/50 text-xs uppercase font-semibold text-gray-400 border-b border-[#45a29e]/20">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Model</th>
              <th className="px-6 py-4">Overall Score</th>
              <th className="px-6 py-4">Latency</th>
              <th className="px-6 py-4">TTFB</th>
              <th className="px-6 py-4">TPS</th>
              <th className="px-6 py-4">Cost / 1M</th>
              <th className="px-6 py-4 text-right">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#45a29e]/10">
            {models.map((m) => (
              <tr
                key={m.model}
                className="hover:bg-[#45a29e]/5 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-[#66fcf1]">
                  #{m.rank}
                </td>
                <td className="px-6 py-4 font-medium text-gray-100">
                  {m.model.split("/").pop()}
                  <div className="text-[10px] text-gray-500 uppercase">
                    {m.provider}
                  </div>
                </td>
                <td className="px-6 py-4 font-bold">{m.overallScore}</td>
                <td className="px-6 py-4 font-mono">
                  {m.metrics.avgLatency}ms
                </td>
                <td className="px-6 py-4 font-mono">{m.metrics.avgTTFB}ms</td>
                <td className="px-6 py-4 font-mono">{m.metrics.avgTPS}</td>
                <td className="px-6 py-4 font-mono text-emerald-400">
                  ${m.metrics.costPer1M.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-right">
                  <HealthBadge score={m.reliabilityScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
