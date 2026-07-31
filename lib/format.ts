export function fmtMoney(
  n: number,
  opts: { compact?: boolean; sign?: boolean; cents?: boolean } = {}
) {
  const abs = Math.abs(n);
  const sign = opts.sign && n > 0 ? "+" : n < 0 ? "−" : "";
  if (opts.compact && abs >= 10000) {
    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: opts.cents || abs % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtDay(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtRelative(ts: number, now = Date.now()) {
  const diff = now - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDay(ts);
}
