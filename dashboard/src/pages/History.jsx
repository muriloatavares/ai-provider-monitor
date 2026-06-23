import { useApi } from '../hooks/useApi'
import { LineChart, Activity, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function History() {
  const { data: history, loading } = useApi('/api/history')

  if (loading) return <div className="text-[#66fcf1] animate-pulse">Loading history trends...</div>

  if (!history || !history.results) {
    return (
      <div className="card text-center py-12">
        <LineChart className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">No historical data available. Run benchmarks first.</p>
      </div>
    )
  }

  // Transform data for Recharts
  const chartData = history.results.map(r => ({
    name: r.model.split('/').pop(),
    latency: r.latency,
    ttfb: r.ttfb,
    tps: r.tps || 0
  })).sort((a, b) => a.latency - b.latency);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#45a29e]/20 pb-4">
        <LineChart className="w-8 h-8 text-[#66fcf1]" />
        <div>
          <h2 className="text-2xl font-bold text-gray-100">History & Trends</h2>
          <p className="text-sm text-gray-400">Streaming benchmark visualization across models</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button className="px-3 py-1 text-xs font-medium bg-[#45a29e]/20 text-[#66fcf1] rounded border border-[#45a29e]/30">Latest Run</button>
        <button className="px-3 py-1 text-xs font-medium bg-[#1f2833] text-gray-400 rounded border border-[#1f2833] opacity-50 cursor-not-allowed" title="Requires SQLite (Phase 11)">24h</button>
        <button className="px-3 py-1 text-xs font-medium bg-[#1f2833] text-gray-400 rounded border border-[#1f2833] opacity-50 cursor-not-allowed" title="Requires SQLite (Phase 11)">7d</button>
        <button className="px-3 py-1 text-xs font-medium bg-[#1f2833] text-gray-400 rounded border border-[#1f2833] opacity-50 cursor-not-allowed" title="Requires SQLite (Phase 11)">30d</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Latency & TTFB Chart */}
        <div className="card h-96">
          <h3 className="text-sm font-medium text-gray-300 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-pink-400"/> Latency vs TTFB (ms)
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2833" />
              <XAxis dataKey="name" stroke="#45a29e" fontSize={10} tick={{fill: '#c5c6c7'}} />
              <YAxis stroke="#45a29e" fontSize={10} tick={{fill: '#c5c6c7'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#45a29e', color: '#fff' }}
                itemStyle={{ color: '#66fcf1' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#c5c6c7' }} />
              <Bar dataKey="latency" name="Total Latency" fill="#ec4899" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ttfb" name="Time To First Byte" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TPS Chart */}
        <div className="card h-96">
          <h3 className="text-sm font-medium text-gray-300 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#66fcf1]"/> Tokens Per Second (TPS)
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2833" />
              <XAxis dataKey="name" stroke="#45a29e" fontSize={10} tick={{fill: '#c5c6c7'}} />
              <YAxis stroke="#45a29e" fontSize={10} tick={{fill: '#c5c6c7'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#45a29e', color: '#fff' }}
                itemStyle={{ color: '#66fcf1' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#c5c6c7' }} />
              <Bar dataKey="tps" name="TPS" fill="#66fcf1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
