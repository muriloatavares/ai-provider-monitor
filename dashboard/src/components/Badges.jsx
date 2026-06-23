export function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  
  const config = {
    online: { classes: 'bg-[#50e3c2]/10 text-[#50e3c2] border border-[#50e3c2]/30', dot: 'bg-[#50e3c2]', label: 'Online' },
    exhausted: { classes: 'bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30', dot: 'bg-[#f5a623]', label: 'Exhausted' },
    free_tier: { classes: 'bg-[#0070F3]/10 text-[#0070F3] border border-[#0070F3]/30', dot: 'bg-[#0070F3]', label: 'Free Tier' },
    no_limit: { classes: 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/30', dot: 'bg-[#a855f7]', label: 'No Limit' },
    offline: { classes: 'bg-[#E00]/10 text-[#E00] border border-[#E00]/30', dot: 'bg-[#E00]', label: 'Offline' },
  };

  const { classes, dot, label } = config[s] || config.offline;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {label}
    </span>
  );
}

export function HealthBadge({ score }) {
  const s = Number(score) || 0;
  let color = 'text-[#E00]';
  if (s >= 90) color = 'text-[#0070F3]';
  else if (s >= 70) color = 'text-[#F5A623]';

  return (
    <span className={`text-[12px] font-mono ${color}`}>
      {s.toFixed(1)}/100
    </span>
  );
}
