import { useApi } from "../hooks/useApi";
import { DollarSign, Database, Activity, TrendingUp } from "lucide-react";

function CostCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#45a29e] mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-100">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        </div>
        <div className="p-3 bg-[#45a29e]/10 rounded-lg">
          <Icon className="w-5 h-5 text-[#66fcf1]" />
        </div>
      </div>
    </div>
  );
}

export default function Costs() {
  const { data: costs, loading } = useApi("/api/costs");

  if (loading)
    return (
      <div className="text-[#66fcf1] animate-pulse">Loading cost data...</div>
    );

  if (!costs || !costs.grandTotalCost) {
    return (
      <div className="card text-center py-12">
        <DollarSign className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">
          No cost data available. Run the pricing engine and benchmarks first.
        </p>
      </div>
    );
  }

  const sessions = costs.sessions || [];
  const totalTokens = sessions.reduce((acc, s) => acc + s.totalTokens, 0);
  const avgCostReq =
    sessions.length > 0 ? costs.grandTotalCost / sessions.length : 0;

  // Highest & Lowest consumer
  const sortedSessions = [...sessions].sort(
    (a, b) => b.exactCost - a.exactCost,
  );
  const highestConsumer = sortedSessions[0] || null;
  const lowestConsumer =
    [...sortedSessions].filter((s) => s.exactCost > 0).pop() || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#45a29e]/20 pb-4">
        <DollarSign className="w-8 h-8 text-[#66fcf1]" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Costs & Billing</h2>
          <p className="text-sm text-gray-400">
            Financial tracking and API spend
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CostCard
          title="Total Cost"
          value={`$${costs.grandTotalCost.toFixed(6)}`}
          icon={DollarSign}
          subtitle="Cumulative session cost"
        />
        <CostCard
          title="Tokens Consumed"
          value={totalTokens.toLocaleString()}
          icon={Database}
          subtitle="Total volume"
        />
        <CostCard
          title="Avg Cost / Request"
          value={`$${avgCostReq.toFixed(6)}`}
          icon={Activity}
          subtitle="Across all models"
        />
        <CostCard
          title="Highest Consumer"
          value={
            highestConsumer ? highestConsumer.model.split("/").pop() : "N/A"
          }
          icon={TrendingUp}
          subtitle={
            highestConsumer ? `$${highestConsumer.exactCost.toFixed(6)}` : ""
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card overflow-x-auto p-0">
          <div className="p-4 border-b border-[#45a29e]/20 bg-[#1f2833]/50">
            <h3 className="font-bold text-gray-100">
              Cost Per Request (Session Log)
            </h3>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1f2833]/50 text-xs uppercase font-semibold text-gray-400 border-b border-[#45a29e]/20">
              <tr>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Tokens</th>
                <th className="px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#45a29e]/10 max-h-96 overflow-y-auto">
              {sessions.map((s, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#45a29e]/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-100">
                    {s.model}
                  </td>
                  <td className="px-6 py-4 font-mono">{s.totalTokens}</td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-400">
                    ${s.exactCost.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card flex items-center justify-center border-dashed border-[#45a29e]/20">
          <div className="text-center text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Cost Trend Chart</p>
            <p className="text-xs mt-2">
              Requires Historical Database Integration (V2 Phase 11)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
