import { CategoryId, Transaction } from "@/lib/types";
import { translate, type Lang } from "@/lib/i18n";

export type Granularity = "day" | "week" | "month" | "year";

/** Ordered granularities; labels come from t(`analytics.gran.${id}`). */
export const GRANULARITIES: Granularity[] = ["day", "week", "month", "year"];

/**
 * Stack order for the main chart. Deliberately NOT the CATEGORIES order:
 * blue (fixed) and purple (leisure) are near-indistinguishable for protan
 * viewers when adjacent, so the stack interleaves them
 * (validated with the dataviz palette checker).
 */
export const STACK_ORDER: CategoryId[] = ["food", "fixed", "mandatory", "leisure"];

const DAY = 86_400_000;

const locale = (lang: Lang) => (lang === "he" ? "he-IL" : "en-US");
/** Hebrew reads better with the full month name ("30 ביולי"), English with short. */
const monthStyle = (lang: Lang): "long" | "short" =>
  lang === "he" ? "long" : "short";

export interface PeriodWindow {
  start: number;
  end: number;
  days: number;
}

/** Calendar-aware window for a granularity at `offset` periods from now (offset <= 0). */
export function periodWindow(
  g: Granularity,
  offset: number,
  now = Date.now()
): PeriodWindow {
  const d = new Date(now);
  let start: Date;
  let end: Date;
  if (g === "day") {
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset + 1);
  } else if (g === "week") {
    const dow = (d.getDay() + 6) % 7; // Monday = 0
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow + offset * 7);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  } else if (g === "month") {
    start = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1);
  } else {
    start = new Date(d.getFullYear() + offset, 0, 1);
    end = new Date(d.getFullYear() + offset + 1, 0, 1);
  }
  return {
    start: start.getTime(),
    end: end.getTime(),
    days: Math.round((end.getTime() - start.getTime()) / DAY),
  };
}

export function periodLabel(
  g: Granularity,
  offset: number,
  start: number,
  lang: Lang
): string {
  const d = new Date(start);
  const loc = locale(lang);
  if (g === "day") {
    const md = d.toLocaleDateString(loc, {
      month: monthStyle(lang),
      day: "numeric",
    });
    if (offset === 0) return `${translate(lang, "analytics.today")}, ${md}`;
    if (offset === -1) return `${translate(lang, "analytics.yesterday")}, ${md}`;
    return `${d.toLocaleDateString(loc, { weekday: "short" })}, ${md}`;
  }
  if (g === "week")
    return translate(lang, "analytics.weekOf", {
      date: d.toLocaleDateString(loc, {
        month: monthStyle(lang),
        day: "numeric",
      }),
    });
  if (g === "month")
    return d.toLocaleDateString(loc, { month: "long", year: "numeric" });
  return String(d.getFullYear());
}

export interface Bucket {
  label: string; // axis label (unique per bucket)
  tip: string; // richer label for the tooltip
  food: number;
  leisure: number;
  fixed: number;
  mandatory: number;
  total: number;
}

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Monday-first single-letter weekday ticks: שני, שלישי, רביעי, חמישי, שישי, שבת, ראשון.
const WEEK_LABELS_HE = ["ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳", "א׳"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Kept to <=4 chars so 12 ticks never collide at 390px / 11px font.
const MONTHS_SHORT_HE = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יוני", "יולי", "אוג", "ספט", "אוק", "נוב", "דצמ"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_LONG_HE = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function hourLabel(h: number, lang: Lang) {
  if (lang === "he") return String(h); // 24h clock: 0..23
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

function hourTip(h: number, lang: Lang) {
  if (lang === "he") return `${h}:00`;
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}:00 ${h < 12 ? "AM" : "PM"}`;
}

/** Aggregate the window's transactions into chart buckets for the granularity. */
export function buildBuckets(
  g: Granularity,
  win: PeriodWindow,
  txs: Transaction[],
  lang: Lang
): Bucket[] {
  const mk = (label: string, tip: string): Bucket => ({
    label,
    tip,
    food: 0,
    leisure: 0,
    fixed: 0,
    mandatory: 0,
    total: 0,
  });

  const loc = locale(lang);
  let buckets: Bucket[];
  if (g === "day") {
    buckets = Array.from({ length: 24 }, (_, h) =>
      mk(hourLabel(h, lang), hourTip(h, lang))
    );
  } else if (g === "week") {
    const labels = lang === "he" ? WEEK_LABELS_HE : WEEK_LABELS;
    buckets = labels.map((w, i) => {
      const day = new Date(win.start);
      const dt = new Date(day.getFullYear(), day.getMonth(), day.getDate() + i);
      const weekday = dt.toLocaleDateString(loc, {
        weekday: lang === "he" ? "long" : "short",
      });
      const md = dt.toLocaleDateString(loc, {
        month: monthStyle(lang),
        day: "numeric",
      });
      return mk(w, `${weekday}, ${md}`);
    });
  } else if (g === "month") {
    const s = new Date(win.start);
    buckets = Array.from({ length: win.days }, (_, i) => {
      const dt = new Date(s.getFullYear(), s.getMonth(), i + 1);
      return mk(
        String(i + 1),
        dt.toLocaleDateString(loc, { month: monthStyle(lang), day: "numeric" })
      );
    });
  } else {
    const short = lang === "he" ? MONTHS_SHORT_HE : MONTHS_SHORT;
    const long = lang === "he" ? MONTHS_LONG_HE : MONTHS_LONG;
    buckets = short.map((m, i) => mk(m, long[i]));
  }

  for (const t of txs) {
    if (t.ts < win.start || t.ts >= win.end) continue;
    const dt = new Date(t.ts);
    let idx: number;
    if (g === "day") idx = dt.getHours();
    else if (g === "week") {
      const dayStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
      idx = Math.round((dayStart - win.start) / DAY);
    } else if (g === "month") idx = dt.getDate() - 1;
    else idx = dt.getMonth();
    const b = buckets[Math.min(buckets.length - 1, Math.max(0, idx))];
    b[t.category] += t.amount;
    b.total += t.amount;
  }
  return buckets;
}

/** Explicit x-axis tick values so labels never collide at 390px. */
export function xTicks(g: Granularity, buckets: Bucket[]): string[] | undefined {
  if (g === "day") return [0, 6, 12, 18].map((i) => buckets[i].label);
  if (g === "month")
    return buckets.filter((_, i) => i === 0 || (i + 1) % 5 === 0).map((b) => b.label);
  return undefined; // week (7) & year (12) show every tick
}

/** Compact currency for axis ticks: 1200 -> "$1.2k". */
export function tickMoney(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `$${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `$${Math.round(n)}`;
}
