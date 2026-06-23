import { useApi } from '../hooks/useApi'
import { Network, Copy, Download, Zap, DollarSign, ShieldCheck, Scale } from 'lucide-react'

function ChainCard({ title, chain, icon: Icon, colorClass }) {
  if (!chain || chain.length === 0) return null;

  const handleCopyArray = () => {
    navigator.clipboard.writeText(JSON.stringify(chain));
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify({ fallback_chain: chain }, null, 2));
  };

  return (
    <div className={`card border-t-4 ${colorClass} mb-6`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-[#0b0c10]/50`}>
            <Icon className={`w-5 h-5`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">{title}</h3>
            <p className="text-xs text-gray-400">Length: {chain.length} models</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyArray} className="px-3 py-1.5 text-xs font-medium bg-[#45a29e]/10 hover:bg-[#45a29e]/20 text-[#66fcf1] rounded transition-colors flex items-center gap-1 border border-[#45a29e]/20">
            <Copy className="w-3 h-3" /> Array
          </button>
          <button onClick={handleCopyJSON} className="px-3 py-1.5 text-xs font-medium bg-[#1f2833] hover:bg-[#1f2833]/80 text-gray-300 rounded transition-colors flex items-center gap-1 border border-gray-700">
            <Copy className="w-3 h-3" /> JSON
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {chain.map((model, idx) => (
          <div key={model} className="flex items-center gap-3 w-full sm:w-auto">
            <div className="px-4 py-3 bg-[#1f2833] border border-[#45a29e]/30 rounded-lg shadow-inner text-sm text-gray-200 w-full text-center font-mono">
              {model}
            </div>
            {idx < chain.length - 1 && (
              <div className="text-[#45a29e] hidden sm:block">➔</div>
            )}
            {idx < chain.length - 1 && (
              <div className="text-[#45a29e] sm:hidden">⬇</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RouterConfig() {
  const { data: router, loading } = useApi('/api/router')

  if (loading) return <div className="text-[#66fcf1] animate-pulse">Loading Auto Router recommendations...</div>

  if (!router || !router.balancedChain) {
    return (
      <div className="card text-center py-12">
        <Network className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">No routing chains available. Run 'npm run router:generate' first.</p>
      </div>
    )
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(router, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `router_recommendations_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-[#45a29e]/20 pb-4">
        <div className="flex items-center gap-3">
          <Network className="w-8 h-8 text-[#66fcf1]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Auto Router</h2>
            <p className="text-sm text-gray-400">Generated fallback chains ready to use</p>
          </div>
        </div>
        <button onClick={handleExport} className="px-4 py-2 text-sm font-medium bg-[#66fcf1] hover:bg-[#45a29e] text-[#0b0c10] rounded transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export All
        </button>
      </div>

      <div className="mt-8">
        <ChainCard title="Balanced Chain (Recommended)" chain={router.balancedChain} icon={Scale} colorClass="border-t-[#66fcf1]" />
        <ChainCard title="Fastest Chain" chain={router.fastestChain} icon={Zap} colorClass="border-t-amber-400" />
        <ChainCard title="Cheapest Chain" chain={router.cheapestChain} icon={DollarSign} colorClass="border-t-emerald-400" />
        <ChainCard title="Most Reliable Chain" chain={router.reliableChain} icon={ShieldCheck} colorClass="border-t-blue-400" />
      </div>
    </div>
  )
}
