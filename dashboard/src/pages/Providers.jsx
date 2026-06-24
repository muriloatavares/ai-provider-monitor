import { useApi } from "../hooks/useApi";
import { Server, Activity } from "lucide-react";
import { StatusBadge, HealthBadge } from "../components/Badges";

export default function Providers() {
  const { data: providers, loading } = useApi("/api/providers");

  if (loading)
    return (
      <div className="text-[#66fcf1] animate-pulse">
        Loading providers data...
      </div>
    );

  const entries = Object.entries(providers || {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#45a29e]/20 pb-4">
        <Server className="w-8 h-8 text-[#66fcf1]" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Providers Status</h2>
          <p className="text-sm text-gray-400">
            Main infrastructure health and limits
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">
            No providers found. Run a benchmark first.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1f2833]/50 text-xs uppercase font-semibold text-gray-400 border-b border-[#45a29e]/20">
              <tr>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Avg Latency</th>
                <th className="px-6 py-4">Avg TTFB</th>
                <th className="px-6 py-4">Success Rate</th>
                <th className="px-6 py-4 text-right">Credits/Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#45a29e]/10">
              {entries.map(([name, data]) => {
                const bench = data.benchmark?.overall || {};

                return (
                  <tr
                    key={name}
                    className="hover:bg-[#45a29e]/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-100 capitalize">
                      {name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={data.status} />
                    </td>
                    <td className="px-6 py-4">
                      <HealthBadge score={data.healthScore} />
                    </td>
                    <td className="px-6 py-4">
                      {bench.avgLatency
                        ? `${Math.round(bench.avgLatency)}ms`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {bench.avgTtfb ? `${Math.round(bench.avgTtfb)}ms` : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {bench.successRate !== undefined
                        ? `${bench.successRate}%`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[#66fcf1]">
                      {typeof data.credits === "number"
                        ? `$${data.credits.toFixed(4)}`
                        : data.credits}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
