import { useState, useCallback, useRef } from 'react'
import { UploadCloud, CheckCircle2, XCircle, ChevronDown, ChevronRight, Cpu, Copy, Gauge } from 'lucide-react'
import { StatusBadge } from '../components/Badges'

function StatItem({ title, value, subtitle, color }) {
  return (
    <div className="flex flex-col">
      <p className="text-[13px] text-[#888] font-medium mb-2">{title}</p>
      <h3 className={`text-3xl font-light tracking-tight ${color || 'text-white'}`}>{value}</h3>
      {subtitle && <p className="text-[11px] text-[#666] mt-2">{subtitle}</p>}
    </div>
  )
}

function KeyRow({ r, idx }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasModels = r.models && r.models.length > 0;
  const hasDetails = hasModels || r.rateLimit || r.usage;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (r.fullKey) {
      navigator.clipboard.writeText(r.fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <>
      <tr 
        className={`hover:bg-[#111] transition-colors ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <td className="px-6 py-3 font-medium text-[#EDEDED]">
          <div className="flex items-center gap-2">
            {hasDetails && (
              expanded 
                ? <ChevronDown className="w-3 h-3 text-[#888]" /> 
                : <ChevronRight className="w-3 h-3 text-[#888]" />
            )}
            {r.provider}
          </div>
        </td>
        <td className="px-6 py-3 font-mono text-[12px]">
          <div className="flex items-center gap-2">
            <span>{r.key}</span>
            <button
              onClick={handleCopy}
              title="Copy full key"
              className="text-[#666] hover:text-white transition-colors p-1 rounded hover:bg-[#222]"
            >
              {copied 
                ? <CheckCircle2 className="w-3.5 h-3.5 text-[#50e3c2]" />
                : <Copy className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </td>
        <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
        <td className="px-6 py-3 text-right font-mono text-[12px]">
          {hasModels ? (
            <span className="text-[#888]">{r.modelCount || r.models.length} models</span>
          ) : (
            <span className="text-[#666]">—</span>
          )}
        </td>
        <td className="px-6 py-3 text-right font-mono text-[#EDEDED]">
          {r.status === 'online' || r.status === 'no_limit' || r.status === 'exhausted'
            ? (r.balance && !isNaN(parseFloat(r.balance)) ? `$${parseFloat(r.balance).toFixed(4)}` : r.balance)
            : r.status === 'free_tier' ? r.balance
            : <span className="text-[#666] text-[11px] truncate max-w-[200px] inline-block" title={r.error}>{r.error || 'Dead'}</span>
          }
        </td>
        <td className="px-6 py-3 text-right font-mono text-[12px]">
          {r.rateLimit?.tokensRemaining && r.rateLimit?.tokensLimit ? (
            <span className="text-[#50e3c2]">{Number(r.rateLimit.tokensRemaining).toLocaleString()}<span className="text-[#666]">/{Number(r.rateLimit.tokensLimit).toLocaleString()}</span></span>
          ) : r.usage?.dollarsUsed !== undefined ? (
            <span className="text-[#888]">${r.usage.dollarsUsed.toFixed(4)} spent</span>
          ) : (
            <span className="text-[#666]">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="px-0 py-0 bg-[#0A0A0A]">
            <div className="px-10 py-4 border-t border-[#222] space-y-4">
              
              {/* Rate Limits & Usage */}
              {(r.rateLimit || r.usage) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-3 h-3 text-[#888]" />
                    <span className="text-[11px] uppercase tracking-widest text-[#888] font-semibold">
                      Limits & Usage
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* OpenRouter usage */}
                    {r.usage && (
                      <>
                        <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                          <p className="text-[10px] text-[#666] uppercase mb-1">Dollars Used</p>
                          <p className="text-[13px] font-mono text-[#EDEDED]">${r.usage.dollarsUsed?.toFixed(4) || '0'}</p>
                        </div>
                        {r.usage.dollarsLimit && (
                          <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                            <p className="text-[10px] text-[#666] uppercase mb-1">Spending Limit</p>
                            <p className="text-[13px] font-mono text-[#EDEDED]">${r.usage.dollarsLimit?.toFixed(4)}</p>
                          </div>
                        )}
                        {r.usage.label && (
                          <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                            <p className="text-[10px] text-[#666] uppercase mb-1">Key Label</p>
                            <p className="text-[13px] font-mono text-[#EDEDED]">{r.usage.label}</p>
                          </div>
                        )}
                      </>
                    )}
                    {/* Groq / xAI rate limits from headers */}
                    {r.rateLimit?.tokensLimit && (
                      <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                        <p className="text-[10px] text-[#666] uppercase mb-1">Token Limit</p>
                        <p className="text-[13px] font-mono text-[#EDEDED]">{Number(r.rateLimit.tokensLimit).toLocaleString()}</p>
                      </div>
                    )}
                    {r.rateLimit?.tokensRemaining && (
                      <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                        <p className="text-[10px] text-[#666] uppercase mb-1">Tokens Remaining</p>
                        <p className="text-[13px] font-mono text-[#50e3c2]">{Number(r.rateLimit.tokensRemaining).toLocaleString()}</p>
                      </div>
                    )}
                    {r.rateLimit?.requestsLimit && (
                      <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                        <p className="text-[10px] text-[#666] uppercase mb-1">Requests/min</p>
                        <p className="text-[13px] font-mono text-[#EDEDED]">{r.rateLimit.requestsLimit}</p>
                      </div>
                    )}
                    {r.rateLimit?.requestsRemaining && (
                      <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                        <p className="text-[10px] text-[#666] uppercase mb-1">Requests Left</p>
                        <p className="text-[13px] font-mono text-[#50e3c2]">{r.rateLimit.requestsRemaining}</p>
                      </div>
                    )}
                    {r.rateLimit?.tokensReset && (
                      <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                        <p className="text-[10px] text-[#666] uppercase mb-1">Resets In</p>
                        <p className="text-[13px] font-mono text-[#888]">{r.rateLimit.tokensReset}</p>
                      </div>
                    )}
                    {/* OpenRouter rate_limit (object with requests, interval) */}
                    {r.rateLimit && typeof r.rateLimit === 'object' && r.rateLimit.requests && (
                      <div className="bg-[#111] border border-[#333] rounded px-3 py-2">
                        <p className="text-[10px] text-[#666] uppercase mb-1">Rate Limit</p>
                        <p className="text-[13px] font-mono text-[#EDEDED]">{r.rateLimit.requests} req/{r.rateLimit.interval}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Models */}
              {hasModels && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-3 h-3 text-[#888]" />
                    <span className="text-[11px] uppercase tracking-widest text-[#888] font-semibold">
                      Available Models ({r.modelCount || r.models.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.models.map((m) => (
                      <span 
                        key={m.id} 
                        className="text-[11px] font-mono text-[#ccc] bg-[#111] border border-[#333] px-2 py-1 rounded hover:border-[#555] transition-colors"
                      >
                        {m.id}
                      </span>
                    ))}
                    {r.modelCount > r.models.length && (
                      <span className="text-[11px] font-mono text-[#666] px-2 py-1">
                        +{r.modelCount - r.models.length} more
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const alive = results ? results.filter(r => r.status === 'online').length : 0;
  const exhausted = results ? results.filter(r => r.status === 'exhausted').length : 0;
  const freeTier = results ? results.filter(r => r.status === 'free_tier').length : 0;
  const noLimit = results ? results.filter(r => r.status === 'no_limit').length : 0;
  const dead = results ? results.filter(r => r.status === 'offline').length : 0;
  const total = results ? results.length : 0;

  const totalBalance = results
    ? results.reduce((sum, r) => {
        if (r.status !== 'offline' && r.balance && !isNaN(parseFloat(r.balance))) {
          return sum + parseFloat(r.balance);
        }
        return sum;
      }, 0)
    : 0;

  const usable = alive; // only keys with actual balance
  const healthPercent = total > 0 ? Math.round((usable / total) * 100) : 0;

  const providerStats = results
    ? results.reduce((acc, r) => {
        if (!acc[r.provider]) acc[r.provider] = { alive: 0, exhausted: 0, free_tier: 0, no_limit: 0, dead: 0, total: 0, balance: 0 };
        acc[r.provider].total++;
        if (r.status === 'online') {
          acc[r.provider].alive++;
          if (r.balance && !isNaN(parseFloat(r.balance))) {
            acc[r.provider].balance += parseFloat(r.balance);
          }
        } else if (r.status === 'exhausted') {
          acc[r.provider].exhausted++;
        } else if (r.status === 'free_tier') {
          acc[r.provider].free_tier++;
        } else if (r.status === 'no_limit') {
          acc[r.provider].no_limit++;
        } else {
          acc[r.provider].dead++;
        }
        return acc;
      }, {})
    : {};

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processText = async (text) => {
    setIsProcessing(true);
    setResults(null);
    try {
      const res = await fetch('/api/check-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) {
        let errText = '';
        try { errText = await res.text(); } catch(e) {}
        throw new Error(`Server returned ${res.status} ${res.statusText}. ${errText.substring(0, 100)}`);
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error(err);
      alert(`Error processing keys: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFiles = (filesList) => {
    const files = Array.from(filesList);
    const txtFiles = files.filter(f => f.name.endsWith('.txt') || f.type === 'text/plain');

    if (txtFiles.length === 0) {
      alert('Please select .txt files only');
      return;
    }

    Promise.all(txtFiles.map(file => file.text()))
      .then(texts => {
        const combinedText = texts.join('\n');
        processText(combinedText);
      });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Overview */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-6 tracking-tight">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 vercel-card">
          <StatItem 
            title="Keys Checked" 
            value={total > 0 ? total : '—'}
            subtitle={total > 0 ? `${alive} alive · ${dead} dead` : 'Drop a .txt to start'}
          />
          <StatItem 
            title="Keys Alive" 
            value={total > 0 ? alive : '—'}
            color={alive > 0 ? 'text-[#0070F3]' : 'text-white'}
          />
          <StatItem 
            title="Total Balance" 
            value={total > 0 ? `$${totalBalance.toFixed(4)}` : '—'}
            subtitle={total > 0 ? 'Sum of OpenRouter keys' : null}
          />
          <StatItem 
            title="Health Rate" 
            value={total > 0 ? `${healthPercent}%` : '—'}
            color={healthPercent >= 80 ? 'text-[#50e3c2]' : healthPercent >= 50 ? 'text-[#f5a623]' : total > 0 ? 'text-[#e00]' : 'text-white'}
          />
        </div>
      </section>

      {/* Dropzone */}
      <section>
        <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Bulk Key Checker</h2>
        
        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={handleZoneClick}
          className={`vercel-card border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-all ${
            isDragging ? 'border-[#0070F3] bg-[#0070F3]/5' : 'border-[#333] hover:border-[#666]'
          }`}
        >
          <input 
            type="file" 
            multiple 
            accept=".txt,text/plain" 
            className="hidden" 
            ref={fileInputRef}
            onChange={onFileInputChange}
          />
          <UploadCloud className={`w-8 h-8 mb-4 ${isDragging ? 'text-[#0070F3]' : 'text-[#666]'}`} />
          <p className="text-[14px] font-medium text-[#EDEDED] mb-1">
            {isProcessing ? 'Checking keys across providers...' : 'Click or drag and drop .txt files here'}
          </p>
          <p className="text-[12px] text-[#888]">
            Supports OpenRouter, Groq, and xAI keys. Duplicates will be ignored.
          </p>
        </div>
      </section>

      {/* Results Table with expandable models */}
      {results && results.length > 0 && (
        <section>
          <div className="vercel-card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#333] flex justify-between items-center bg-[#0A0A0A]">
              <h3 className="text-[13px] font-medium text-[#EDEDED]">Checked Keys ({results.length})</h3>
              <div className="flex gap-4 text-[12px]">
                <span className="text-[#50e3c2] flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {alive} Alive</span>
                {exhausted > 0 && <span className="text-[#f5a623] flex items-center gap-1">⚠ {exhausted} Exhausted</span>}
                {freeTier > 0 && <span className="text-[#0070F3] flex items-center gap-1">○ {freeTier} Free</span>}
                {noLimit > 0 && <span className="text-[#a855f7] flex items-center gap-1">? {noLimit} No Limit</span>}
                <span className="text-[#E00] flex items-center gap-1"><XCircle className="w-3 h-3"/> {dead} Dead</span>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-[13px] text-[#888]">
                <thead className="border-b border-[#333] bg-[#000] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-medium">Provider</th>
                    <th className="px-6 py-3 font-medium">Key Prefix</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Models</th>
                    <th className="px-6 py-3 font-medium text-right">Balance</th>
                    <th className="px-6 py-3 font-medium text-right">Tokens Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                  {results.map((r, idx) => (
                    <KeyRow key={idx} r={r} idx={idx} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Provider Summary */}
      {results && results.length > 0 && Object.keys(providerStats).length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white tracking-tight mb-6">Provider Summary</h2>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(Object.keys(providerStats).length, 3)} gap-6`}>
            {Object.entries(providerStats).map(([name, stats]) => (
              <div key={name} className="vercel-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-[#EDEDED]">{name}</h3>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    stats.dead === 0 ? 'border-[#50e3c2]/30 text-[#50e3c2] bg-[#50e3c2]/5' : 'border-[#f5a623]/30 text-[#f5a623] bg-[#f5a623]/5'
                  }`}>
                    {stats.alive}/{stats.total} alive
                  </span>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#888]">Alive</span>
                    <span className="text-[#50e3c2] font-mono">{stats.alive}</span>
                  </div>
                  {stats.exhausted > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#888]">Exhausted</span>
                      <span className="text-[#f5a623] font-mono">{stats.exhausted}</span>
                    </div>
                  )}
                  {stats.free_tier > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#888]">Free Tier</span>
                      <span className="text-[#0070F3] font-mono">{stats.free_tier}</span>
                    </div>
                  )}
                  {stats.no_limit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#888]">No Limit Set</span>
                      <span className="text-[#a855f7] font-mono">{stats.no_limit}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#888]">Dead</span>
                    <span className="text-[#e00] font-mono">{stats.dead}</span>
                  </div>
                  {stats.balance > 0 && (
                    <div className="flex justify-between border-t border-[#333] pt-2 mt-2">
                      <span className="text-[#888]">Total Balance</span>
                      <span className="text-[#EDEDED] font-mono font-medium">${stats.balance.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
