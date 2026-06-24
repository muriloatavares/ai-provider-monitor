import { useState, useCallback, useRef } from "react";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Cpu,
  Copy,
  Gauge,
  HelpCircle,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { KeyStatusBadge, QuotaStatusBadge } from "../components/Badges";
import SkeletonRow from "../components/SkeletonRow";

function StatItem({ title, value, subtitle, color }) {
  return (
    <div className="flex flex-col">
      <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-2">
        {title}
      </p>
      <h3
        className={`text-3xl font-light tracking-tight ${color || "text-[var(--text-primary)]"}`}
      >
        {value}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-[var(--text-muted)] mt-2">{subtitle}</p>
      )}
    </div>
  );
}

function KeyRow({ r, idx }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasModels = r.models && r.models.length > 0;
  const hasDetails =
    hasModels || r.metadata?.rateLimit || r.metadata?.usageDetails;

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
        className={`hover:bg-[var(--hover-bg)] transition-colors key-row-enter ${hasDetails ? "cursor-pointer" : ""}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <td className="px-6 py-3 font-medium text-[var(--text-primary)]">
          <div className="flex items-center gap-2">
            {hasDetails &&
              (expanded ? (
                <ChevronDown className="w-3 h-3 text-[var(--text-secondary)]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[var(--text-secondary)]" />
              ))}
            {r.provider}
          </div>
        </td>
        <td className="px-6 py-3 font-mono text-[12px]">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <span>{r.key}</span>
            <button
              onClick={handleCopy}
              title="Copy full key"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-secondary)]"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#50e3c2]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </td>
        <td className="px-6 py-3">
          <KeyStatusBadge status={r.keyStatus} />
        </td>
        <td className="px-6 py-3 text-right font-mono text-[12px]">
          {hasModels ? (
            <span className="text-[var(--text-secondary)]">
              {r.models.length} models
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">—</span>
          )}
        </td>
        <td className="px-6 py-3 text-right font-mono text-[var(--text-primary)]">
          <div className="flex items-center justify-end gap-2">
            <QuotaStatusBadge status={r.quotaStatus} />
            {r.balance !== null && (
              <span className="ml-1">${parseFloat(r.balance).toFixed(4)}</span>
            )}
            {r.metadata?.error && (
              <span
                className="text-[#E00] text-[11px] truncate max-w-[150px] inline-block ml-2"
                title={r.metadata.error}
              >
                {r.metadata.error}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-3 text-right font-mono text-[12px]">
          {r.metadata?.rateLimit?.tokensRemaining &&
          r.metadata?.rateLimit?.tokensLimit ? (
            <span className="text-[#50e3c2]">
              {Number(r.metadata.rateLimit.tokensRemaining).toLocaleString()}
              <span className="text-[var(--text-muted)]">
                /{Number(r.metadata.rateLimit.tokensLimit).toLocaleString()}
              </span>
            </span>
          ) : r.metadata?.usageDetails?.dollarsUsed !== undefined ? (
            <span className="text-[var(--text-secondary)]">
              ${r.metadata.usageDetails.dollarsUsed.toFixed(4)} spent
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan="6" className="px-0 py-0 bg-[var(--bg-card)]">
            <div className="px-10 py-4 border-t border-[var(--border-secondary)] space-y-4">
              {/* Rate Limits & Usage */}
              {(r.metadata?.rateLimit || r.metadata?.usageDetails) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-3 h-3 text-[var(--text-secondary)]" />
                    <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                      Limits & Usage Data
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {r.metadata.usageDetails && (
                      <>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                            Dollars Used
                          </p>
                          <p className="text-[13px] font-mono text-[var(--text-primary)]">
                            $
                            {r.metadata.usageDetails.dollarsUsed?.toFixed(4) ||
                              "0"}
                          </p>
                        </div>
                        {r.metadata.usageDetails.dollarsLimit !== null && (
                          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                              Spending Limit
                            </p>
                            <p className="text-[13px] font-mono text-[var(--text-primary)]">
                              $
                              {r.metadata.usageDetails.dollarsLimit?.toFixed(4)}
                            </p>
                          </div>
                        )}
                        {r.metadata.usageDetails.label && (
                          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                              Key Label
                            </p>
                            <p className="text-[13px] font-mono text-[var(--text-primary)]">
                              {r.metadata.usageDetails.label}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {r.metadata.rateLimit?.tokensLimit && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Token Limit
                        </p>
                        <p className="text-[13px] font-mono text-[var(--text-primary)]">
                          {Number(
                            r.metadata.rateLimit.tokensLimit,
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {r.metadata.rateLimit?.tokensRemaining && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Tokens Remaining
                        </p>
                        <p className="text-[13px] font-mono text-[#50e3c2]">
                          {Number(
                            r.metadata.rateLimit.tokensRemaining,
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {r.metadata.rateLimit?.requestsLimit && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Requests Limit
                        </p>
                        <p className="text-[13px] font-mono text-[var(--text-primary)]">
                          {r.metadata.rateLimit.requestsLimit}
                        </p>
                      </div>
                    )}
                    {r.metadata.rateLimit?.requestsRemaining && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded px-3 py-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">
                          Requests Left
                        </p>
                        <p className="text-[13px] font-mono text-[#50e3c2]">
                          {r.metadata.rateLimit.requestsRemaining}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Models */}
              {hasModels && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-3 h-3 text-[var(--text-secondary)]" />
                    <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
                      Available Models ({r.models.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.models.map((m) => (
                      <span
                        key={m.id}
                        className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-2 py-1 rounded hover:border-[var(--border-secondary)] transition-colors"
                      >
                        {m.id}
                      </span>
                    ))}
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
  const [totalKeys, setTotalKeys] = useState(0);
  const fileInputRef = useRef(null);

  const total = results ? results.length : 0;

  // New aggregations
  const validKeys = results
    ? results.filter((r) => r.keyStatus === "valid").length
    : 0;
  const invalidKeys = results
    ? results.filter(
        (r) => r.keyStatus === "invalid" || r.keyStatus === "error",
      ).length
    : 0;
  const restrictedKeys = results
    ? results.filter((r) => r.keyStatus === "restricted").length
    : 0;
  const rateLimitedKeys = results
    ? results.filter((r) => r.keyStatus === "rate_limited").length
    : 0;

  const unknownQuotaKeys = results
    ? results.filter((r) => r.quotaStatus === "unknown").length
    : 0;
  const exhaustedKeys = results
    ? results.filter((r) => r.quotaStatus === "exhausted").length
    : 0;
  const freeTierKeys = results
    ? results.filter((r) => r.quotaStatus === "free_tier").length
    : 0;
  const availableKeys = results
    ? results.filter((r) => r.quotaStatus === "available").length
    : 0;

  const totalBalance = results
    ? results.reduce((sum, r) => {
        if (r.balance && !isNaN(parseFloat(r.balance))) {
          return sum + parseFloat(r.balance);
        }
        return sum;
      }, 0)
    : 0;

  const providerStats = results
    ? results.reduce((acc, r) => {
        if (!acc[r.provider])
          acc[r.provider] = {
            valid: 0,
            invalid: 0,
            restricted: 0,
            rate_limited: 0,
            error: 0,
            unknown: 0,
            total: 0,
            balance: 0,
            available: 0,
            unknownQuota: 0,
            exhausted: 0,
            free_tier: 0,
          };
        acc[r.provider].total++;
        if (r.keyStatus)
          acc[r.provider][r.keyStatus] =
            (acc[r.provider][r.keyStatus] || 0) + 1;

        if (r.quotaStatus === "available") {
          acc[r.provider].available++;
          if (r.balance && !isNaN(parseFloat(r.balance))) {
            acc[r.provider].balance += parseFloat(r.balance);
          }
        } else if (r.quotaStatus === "exhausted") {
          acc[r.provider].exhausted++;
        } else if (r.quotaStatus === "free_tier") {
          acc[r.provider].free_tier++;
        } else if (r.quotaStatus === "unknown") {
          acc[r.provider].unknownQuota++;
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
    setResults([]);
    setTotalKeys(0);

    try {
      const res = await fetch("/api/check-keys-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");

        buffer = lines.pop() || "";

        for (const block of lines) {
          const linesInBlock = block.split("\n");
          let event = "message";
          let data = null;

          for (const line of linesInBlock) {
            if (line.startsWith("event: ")) {
              event = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              data = JSON.parse(line.replace("data: ", "").trim());
            }
          }

          if (event === "init") {
            setTotalKeys(data.total);
          } else if (event === "result") {
            setResults((prev) => [...(prev || []), data]);
          } else if (event === "done") {
            setIsProcessing(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Error processing keys: ${err.message}`);
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFiles = (filesList) => {
    const files = Array.from(filesList);
    const txtFiles = files.filter(
      (f) => f.name.endsWith(".txt") || f.type === "text/plain",
    );

    if (txtFiles.length === 0) {
      alert("Please select .txt files only");
      return;
    }

    Promise.all(txtFiles.map((file) => file.text())).then((texts) => {
      const combinedText = texts.join("\n");
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

  const skeletonsToRender =
    isProcessing && totalKeys > total ? Math.min(totalKeys - total, 10) : 0;

  return (
    <div className="space-y-12">
      {/* Overview */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 tracking-tight">
          Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 vercel-card">
          <StatItem
            title="Keys Checked"
            value={
              totalKeys > 0 ? `${total}/${totalKeys}` : total > 0 ? total : "—"
            }
            subtitle={
              total > 0
                ? `${validKeys} valid · ${invalidKeys} invalid`
                : "Drop a .txt to start"
            }
          />
          <StatItem
            title="Keys Valid"
            value={total > 0 ? validKeys : "—"}
            color={
              validKeys > 0 ? "text-[#50e3c2]" : "text-[var(--text-primary)]"
            }
            subtitle={total > 0 ? `${rateLimitedKeys} rate limited` : null}
          />
          <StatItem
            title="Confirmed Balance"
            value={total > 0 ? `$${totalBalance.toFixed(4)}` : "—"}
            subtitle={total > 0 ? "From available keys only" : null}
          />
          <StatItem
            title="Unknown Quota"
            value={total > 0 ? unknownQuotaKeys : "—"}
            color={
              unknownQuotaKeys > 0
                ? "text-[#888]"
                : "text-[var(--text-primary)]"
            }
            subtitle={total > 0 ? `API did not provide limit data` : null}
          />
        </div>
      </section>

      {/* Dropzone */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight mb-6">
          Bulk Key Checker
        </h2>

        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={handleZoneClick}
          className={`vercel-card border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-all ${
            isDragging
              ? "border-[#0070F3] bg-[#0070F3]/5"
              : "border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
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
          <UploadCloud
            className={`w-8 h-8 mb-4 ${isDragging ? "text-[#0070F3]" : "text-[var(--text-muted)]"}`}
          />
          <p className="text-[14px] font-medium text-[var(--text-primary)] mb-1">
            {isProcessing
              ? "Checking keys across providers..."
              : "Click or drag and drop .txt files here"}
          </p>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Supports OpenRouter, Anthropic, Gemini, Groq, and xAI keys.
            Duplicates will be ignored.
          </p>
        </div>
      </section>

      {/* Results Table with expandable models */}
      {(results !== null || totalKeys > 0) && (
        <section>
          <div className="vercel-card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-card)]">
              <div>
                <h3 className="text-[13px] font-medium text-[var(--text-primary)]">
                  Checked Keys ({total})
                </h3>
                {isProcessing && totalKeys > 0 && (
                  <div className="w-48 h-1.5 bg-[var(--bg-secondary)] rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-[#0070F3] transition-all duration-300"
                      style={{ width: `${(total / totalKeys) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4 text-[12px]">
                <span className="text-[#50e3c2] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {validKeys} Valid
                </span>
                {rateLimitedKeys > 0 && (
                  <span className="text-[#f5a623] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {rateLimitedKeys} Rate
                    Limited
                  </span>
                )}
                {restrictedKeys > 0 && (
                  <span className="text-[#f5a623] flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> {restrictedKeys}{" "}
                    Restricted
                  </span>
                )}
                {unknownQuotaKeys > 0 && (
                  <span className="text-[#888] flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> {unknownQuotaKeys}{" "}
                    Unknown Limits
                  </span>
                )}
                <span className="text-[#E00] flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {invalidKeys} Invalid
                </span>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-[13px] text-[var(--text-secondary)]">
                <thead className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 font-medium">Provider</th>
                    <th className="px-6 py-3 font-medium">Key Prefix</th>
                    <th className="px-6 py-3 font-medium">Key Status</th>
                    <th className="px-6 py-3 font-medium text-right">Models</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Limits Status
                    </th>
                    <th className="px-6 py-3 font-medium text-right">
                      Tokens Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {results &&
                    results.map((r, idx) => (
                      <KeyRow key={idx} r={r} idx={idx} />
                    ))}
                  {Array.from({ length: skeletonsToRender }).map((_, i) => (
                    <SkeletonRow key={`skel-${i}`} />
                  ))}
                  {isProcessing && totalKeys - total > 10 && (
                    <tr className="bg-[var(--bg-card)]">
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-[12px] text-[var(--text-muted)] animate-pulse"
                      >
                        + {totalKeys - total - 10} chaves pendentes...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Provider Summary */}
      {results &&
        results.length > 0 &&
        Object.keys(providerStats).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight mb-6">
              Provider Summary
            </h2>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(Object.keys(providerStats).length, 3)} gap-6`}
            >
              {Object.entries(providerStats).map(([name, stats]) => (
                <div key={name} className="vercel-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {name}
                    </h3>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        stats.invalid === 0
                          ? "border-[#50e3c2]/30 text-[#50e3c2] bg-[#50e3c2]/5"
                          : "border-[#f5a623]/30 text-[#f5a623] bg-[#f5a623]/5"
                      }`}
                    >
                      {stats.valid}/{stats.total} valid
                    </span>
                  </div>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">
                        Valid
                      </span>
                      <span className="text-[#50e3c2] font-mono">
                        {stats.valid}
                      </span>
                    </div>
                    {stats.rate_limited > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Rate Limited
                        </span>
                        <span className="text-[#f5a623] font-mono">
                          {stats.rate_limited}
                        </span>
                      </div>
                    )}
                    {stats.restricted > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Restricted
                        </span>
                        <span className="text-[#f5a623] font-mono">
                          {stats.restricted}
                        </span>
                      </div>
                    )}
                    {stats.invalid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          Invalid/Error
                        </span>
                        <span className="text-[#e00] font-mono">
                          {stats.invalid + stats.error}
                        </span>
                      </div>
                    )}
                    {stats.unknownQuota > 0 && (
                      <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 mt-2">
                        <span className="text-[var(--text-secondary)]">
                          Unknown Limits
                        </span>
                        <span className="text-[#888] font-mono">
                          {stats.unknownQuota}
                        </span>
                      </div>
                    )}
                    {stats.balance > 0 && (
                      <div className="flex justify-between border-t border-[var(--border-primary)] pt-2 mt-2">
                        <span className="text-[var(--text-secondary)]">
                          Confirmed Balance
                        </span>
                        <span className="text-[var(--text-primary)] font-mono font-medium">
                          ${stats.balance.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}
