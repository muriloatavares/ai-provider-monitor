import { useApi } from "../hooks/useApi";
import { Cpu, Server, Activity, ShieldCheck, Zap } from "lucide-react";

export default function ProviderAnalytics() {
  const { data: providerData, loading } = useApi("/api/provider-analytics");

  if (loading)
    return (
      <div className="text-[#66fcf1] animate-pulse">
        Loading infrastructure analytics...
      </div>
    );

  if (
    !providerData ||
    !providerData.history ||
    providerData.history.length === 0
  ) {
    return (
      <div className="card text-center py-12">
        <Cpu className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">
          No underlying provider history available. Run benchmarks through
          OpenRouter first.
        </p>
      </div>
    );
  }

  // Aggregate Data
  const stats = {};

  providerData.history.forEach((req) => {
    // Only process OpenRouter routed requests where we captured underlying provider
    if (!req.underlyingProvider || req.underlyingProvider === "Unknown") return;

    const prov = req.underlyingProvider;
    if (!stats[prov]) {
      stats[prov] = {
        name: prov,
        requests: 0,
        successes: 0,
        latencySum: 0,
        ttfbSum: 0, // Assuming ttfb might be recorded in history now or fallback
      };
    }

    stats[prov].requests++;
    if (req.status === 200 || req.success) {
      stats[prov].successes++;
    }
    if (req.latency) stats[prov].latencySum += req.latency;
    if (req.ttfb) stats[prov].ttfbSum += req.ttfb;
  });

  const backends = Object.values(stats)
    .map((s) => {
      const successRate = s.requests > 0 ? (s.successes / s.requests) * 100 : 0;
      const failRate = 100 - successRate;
      const avgLatency = s.requests > 0 ? s.latencySum / s.requests : 0;
      const avgTtfb = s.requests > 0 ? s.ttfbSum / s.requests : 0;

      // Custom score just for ranking backends: weight success heavily, then latency
      const score =
        successRate * 0.6 + Math.max(0, 100 - avgLatency / 10) * 0.4;

      return {
        ...s,
        successRate,
        failRate,
        avgLatency,
        avgTtfb,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (backends.length === 0) {
    return (
      <div className="card text-center py-12">
        <Cpu className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">
          OpenRouter did not return any 'x-openrouter-provider' headers in the
          recorded history.
        </p>
      </div>
    );
  }

  const bestBackend = backends[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#45a29e]/20 pb-4">
        <Cpu className="w-8 h-8 text-[#66fcf1]" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            Infrastructure Analytics
          </h2>
          <p className="text-sm text-gray-400">
            Deep observability into OpenRouter's underlying compute clusters
          </p>
        </div>
      </div>

      <div className="card border border-[#66fcf1]/30 bg-[#1f2833]/80 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrophyIcon className="w-24 h-24 text-[#66fcf1]" />
        </div>
        <h3 className="text-sm text-[#45a29e] font-bold uppercase tracking-widest mb-1">
          Top Performing Backend
        </h3>
        <h2 className="text-3xl font-black text-gray-100 mb-4">
          {bestBackend.name}
        </h2>
        <div className="flex gap-6">
          <div>
            <div className="text-xs text-gray-500">Success Rate</div>
            <div className="text-lg text-emerald-400 font-mono">
              {bestBackend.successRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Latency</div>
            <div className="text-lg text-gray-200 font-mono">
              {Math.round(bestBackend.avgLatency)}ms
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Requests Handled</div>
            <div className="text-lg text-gray-200 font-mono">
              {bestBackend.requests}
            </div>
          </div>
        </div>
      </div>

      <div className="pl-2 border-l-2 border-[#45a29e]/30 space-y-4">
        <div className="flex items-center gap-2 mb-2 text-gray-300">
          <Server className="w-5 h-5 text-[#45a29e]" />
          <span className="font-bold text-lg">OpenRouter Gateway</span>
        </div>

        <div className="pl-6 space-y-4 relative">
          {/* Tree Line */}
          <div className="absolute top-0 bottom-4 left-0 w-px bg-[#45a29e]/20"></div>

          {backends.map((backend, index) => (
            <div key={backend.name} className="relative">
              {/* Branch Line */}
              <div className="absolute top-6 left-0 w-6 h-px bg-[#45a29e]/20 -ml-6"></div>

              <div className="card p-5 hover:border-[#66fcf1]/30 transition-colors">
                <div className="flex justify-between items-start mb-4 border-b border-[#45a29e]/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#1f2833] flex items-center justify-center border border-[#45a29e]/30 text-gray-300 font-bold">
                      #{index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">
                      {backend.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#66fcf1]">
                      {backend.requests}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase">
                      Requests
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0b0c10]/50 p-2 rounded border border-[#1f2833]">
                    <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <Activity className="w-3 h-3" /> Latency
                    </div>
                    <div className="font-mono text-gray-200">
                      {Math.round(backend.avgLatency)}ms
                    </div>
                  </div>
                  <div className="bg-[#0b0c10]/50 p-2 rounded border border-[#1f2833]">
                    <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3" /> TTFB
                    </div>
                    <div className="font-mono text-gray-200">
                      {Math.round(backend.avgTtfb)}ms
                    </div>
                  </div>
                  <div className="bg-[#0b0c10]/50 p-2 rounded border border-[#1f2833]">
                    <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />{" "}
                      Success
                    </div>
                    <div className="font-mono text-emerald-400">
                      {backend.successRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[#0b0c10]/50 p-2 rounded border border-[#1f2833]">
                    <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1 mb-1">
                      <ShieldCheck className="w-3 h-3 text-red-400" /> Failure
                    </div>
                    <div className="font-mono text-red-400">
                      {backend.failRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrophyIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 3.31 2.69 6 6 6s6-2.69 6-6V2Z" />
    </svg>
  );
}
