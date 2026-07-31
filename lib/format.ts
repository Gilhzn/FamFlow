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

export type FmtLang = "en" | "he";

const locale = (lang: FmtLang) => (lang === "he" ? "he-IL" : "en-US");

export function fmtDay(ts: number, lang: FmtLang = "en") {
  return new Date(ts).toLocaleDateString(locale(lang), {
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(ts: number, lang: FmtLang = "en") {
  return new Date(ts).toLocaleTimeString(locale(lang), {
    hour: "numeric",
    minute: "2-digit",
  });
}

const REL = {
  en: {
    now: "just now",
    m: (n: number) => `${n}m ago`,
    h: (n: number) => `${n}h ago`,
    d: (n: number) => `${n}d ago`,
  },
  he: {
    now: "ממש עכשיו",
    m: (n: number) => `לפני ${n} דק׳`,
    h: (n: number) => `לפני ${n} שע׳`,
    d: (n: number) => `לפני ${n} ימים`,
  },
};

export function fmtRelative(ts: number, lang: FmtLang = "en", now = Date.now()) {
  const r = REL[lang];
  const diff = now - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return r.now;
  if (m < 60) return r.m(m);
  const h = Math.floor(m / 60);
  if (h < 24) return r.h(h);
  const d = Math.floor(h / 24);
  if (d < 7) return r.d(d);
  return fmtDay(ts, lang);
}
