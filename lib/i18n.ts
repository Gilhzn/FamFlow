"use client";

import { create } from "zustand";
import { dashboardDict } from "./i18n-dicts/dashboard";
import { ledgerDict } from "./i18n-dicts/ledger";
import { scanDict } from "./i18n-dicts/scan";
import { analyticsDict } from "./i18n-dicts/analytics";
import { walletDict } from "./i18n-dicts/wallet";
import { adminDict } from "./i18n-dicts/admin";

export type Lang = "en" | "he";

export type Dict = { en: Record<string, string>; he: Record<string, string> };

/** Core strings: shell, navigation, login/auth, categories, shared. */
const core: Dict = {
  en: {
    "app.name": "FamFinance AI",
    "app.liveSync": "Live sync",
    "nav.home": "Home",
    "nav.ledger": "Ledger",
    "nav.scan": "Scan",
    "nav.analytics": "Analytics",
    "nav.wallet": "Wallet",
    "nav.admin": "Admin",
    "shell.syncing": "Syncing family ledger…",
    "shell.switchMember": "Switch member",

    "cat.food": "Food & Groceries",
    "cat.food.short": "Food",
    "cat.leisure": "Leisure & Entertainment",
    "cat.leisure.short": "Leisure",
    "cat.fixed": "Fixed Costs",
    "cat.fixed.short": "Fixed",
    "cat.mandatory": "Mandatory Commitments",
    "cat.mandatory.short": "Mandatory",

    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.close": "Close",
    "common.back": "Back",
    "common.add": "Add",
    "common.total": "Total",
    "common.member": "Member",
    "common.admin": "Admin",
    "common.adminParent": "Admin · Parent",
    "common.justNow": "just now",
    "common.minAgo": "{n}m ago",
    "common.hourAgo": "{n}h ago",
    "common.dayAgo": "{n}d ago",

    "alerts.title": "Live notifications",
    "alerts.total": "{n} total",
    "alerts.empty":
      "All quiet. Alerts appear here the moment governance rules trigger.",
    "alerts.dismiss": "Dismiss",

    "login.title": "FamFinance AI",
    "login.subtitle.demo": "{family} — pick your profile to enter the shared ledger",
    "login.subtitle.real": "Welcome back — sign in to your family ledger",
    "login.enter": "Enter",
    "login.capPerMonth": "· ${n}/mo cap",
    "login.adminFull": "Admin · full governance",
    "login.multiDevice":
      "Multi-device demo: open this app in a second tab or window — every entry syncs across the family in real time.",
    "login.demoFamily": "Try the demo family",
    "login.myFamily": "My family",
    "login.createFamily": "Create a new family",
    "login.signIn": "Sign in",
    "login.signUp": "Sign up",
    "login.email": "Email",
    "login.password": "Password",
    "login.pin": "PIN code",
    "login.pinFor": "Enter PIN for {name}",
    "login.wrongPassword": "Incorrect email or password",
    "login.wrongPin": "Incorrect PIN",
    "login.familyName": "Family name",
    "login.yourName": "Your name",
    "login.monthlyBudget": "Monthly family budget",
    "login.signUpTitle": "Create your family",
    "login.signUpSubtitle":
      "You'll be the family admin. Add members with PIN codes later from the Admin screen.",
    "login.create": "Create family & sign in",
    "login.haveFamily": "This device already has a family — sign in",
    "login.passwordMin": "Password must be at least 6 characters",
    "login.nameRequired": "Name is required",
    "login.emailInvalid": "Enter a valid email",
    "login.familyRequired": "Family name is required",
    "login.noPassword": "No password set — click to enter",
    "login.backToDemo": "Back to demo family",
    "login.dataNote":
      "Accounts live in this browser and sync across its tabs — no data leaves your device.",

    "lang.toggle": "עברית",
  },
  he: {
    "app.name": "FamFinance AI",
    "app.liveSync": "סנכרון חי",
    "nav.home": "בית",
    "nav.ledger": "לדג'ר",
    "nav.scan": "סריקה",
    "nav.analytics": "אנליטיקה",
    "nav.wallet": "ארנק",
    "nav.admin": "ניהול",
    "shell.syncing": "מסנכרן את הלדג'ר המשפחתי…",
    "shell.switchMember": "החלפת משתמש",

    "cat.food": "מזון וקניות",
    "cat.food.short": "מזון",
    "cat.leisure": "פנאי ובידור",
    "cat.leisure.short": "פנאי",
    "cat.fixed": "הוצאות קבועות",
    "cat.fixed.short": "קבועות",
    "cat.mandatory": "התחייבויות חובה",
    "cat.mandatory.short": "חובה",

    "common.save": "שמירה",
    "common.cancel": "ביטול",
    "common.delete": "מחיקה",
    "common.close": "סגירה",
    "common.back": "חזרה",
    "common.add": "הוספה",
    "common.total": 'סה"כ',
    "common.member": "חבר משפחה",
    "common.admin": "מנהל",
    "common.adminParent": "מנהל · הורה",
    "common.justNow": "ממש עכשיו",
    "common.minAgo": "לפני {n} דק'",
    "common.hourAgo": "לפני {n} שע'",
    "common.dayAgo": "לפני {n} ימים",

    "alerts.title": "התראות בזמן אמת",
    "alerts.total": "{n} סה\"כ",
    "alerts.empty": "הכול שקט. התראות יופיעו כאן ברגע שכללי הבקרה יופעלו.",
    "alerts.dismiss": "הסרה",

    "login.title": "FamFinance AI",
    "login.subtitle.demo": "{family} — בחרו פרופיל כדי להיכנס ללדג'ר המשותף",
    "login.subtitle.real": "ברוכים השבים — התחברו ללדג'ר המשפחתי",
    "login.enter": "כניסה",
    "login.capPerMonth": "· תקרה ${n} לחודש",
    "login.adminFull": "מנהל · שליטה מלאה",
    "login.multiDevice":
      "הדגמת ריבוי מכשירים: פתחו את האפליקציה בטאב או חלון נוסף — כל רישום מסתנכרן בין בני המשפחה בזמן אמת.",
    "login.demoFamily": "נסו את משפחת הדמו",
    "login.myFamily": "המשפחה שלי",
    "login.createFamily": "יצירת משפחה חדשה",
    "login.signIn": "התחברות",
    "login.signUp": "הרשמה",
    "login.email": "אימייל",
    "login.password": "סיסמה",
    "login.pin": "קוד PIN",
    "login.pinFor": "הזינו PIN עבור {name}",
    "login.wrongPassword": "אימייל או סיסמה שגויים",
    "login.wrongPin": "PIN שגוי",
    "login.familyName": "שם המשפחה",
    "login.yourName": "השם שלך",
    "login.monthlyBudget": "תקציב משפחתי חודשי",
    "login.signUpTitle": "צרו את המשפחה שלכם",
    "login.signUpSubtitle":
      "אתם תהיו מנהלי המשפחה. אפשר להוסיף בני משפחה עם קודי PIN מאוחר יותר במסך הניהול.",
    "login.create": "יצירת משפחה והתחברות",
    "login.haveFamily": "במכשיר הזה כבר קיימת משפחה — התחברות",
    "login.passwordMin": "הסיסמה חייבת להכיל לפחות 6 תווים",
    "login.nameRequired": "חובה להזין שם",
    "login.emailInvalid": "הזינו אימייל תקין",
    "login.familyRequired": "חובה להזין שם משפחה",
    "login.noPassword": "לא הוגדרה סיסמה — לחצו כדי להיכנס",
    "login.backToDemo": "חזרה למשפחת הדמו",
    "login.dataNote":
      "החשבונות נשמרים בדפדפן הזה ומסתנכרנים בין הטאבים שלו — שום מידע לא עוזב את המכשיר.",

    "lang.toggle": "English",
  },
};

const MODULE_DICTS: Dict[] = [
  core,
  dashboardDict,
  ledgerDict,
  scanDict,
  analyticsDict,
  walletDict,
  adminDict,
];

const merged: Record<Lang, Record<string, string>> = { en: {}, he: {} };
for (const d of MODULE_DICTS) {
  Object.assign(merged.en, d.en);
  Object.assign(merged.he, d.he);
}

const LANG_KEY = "famflow.lang.v1";

interface UIStore {
  lang: Lang;
  setLang: (l: Lang) => void;
}

function applyDir(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export const useUI = create<UIStore>((set) => ({
  // Always start as "en" so SSR/prerender markup matches the first client
  // render; the persisted language is applied post-mount (syncDirWithLang).
  lang: "en",
  setLang: (l) => {
    set({ lang: l });
    applyDir(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  },
}));

/** Post-mount: apply the persisted language + direction (avoids hydration mismatch). */
export function syncDirWithLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "he" || v === "en") {
      if (v !== useUI.getState().lang) useUI.getState().setLang(v);
      else applyDir(v);
      return;
    }
  } catch {}
  applyDir(useUI.getState().lang);
}

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let s = merged[lang][key] ?? merged.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

/** Hook: returns t() bound to the active language. */
export function useT() {
  const lang = useUI((s) => s.lang);
  return {
    lang,
    t: (key: string, params?: Record<string, string | number>) =>
      translate(lang, key, params),
  };
}
