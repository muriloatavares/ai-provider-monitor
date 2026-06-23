import { Outlet } from 'react-router-dom'
import { Activity } from 'lucide-react'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#000000] flex flex-col font-sans">
      {/* Vercel Style Header */}
      <header className="border-b border-[#333] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-white rounded-full flex items-center justify-center">
            <Activity className="w-3 h-3 text-white" />
          </div>
          <h1 className="text-sm font-semibold text-white tracking-wide">
            AI Providers Monitor
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[11px] uppercase tracking-widest text-[#888] font-semibold border border-[#333] px-2 py-1 rounded">
            Production
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
