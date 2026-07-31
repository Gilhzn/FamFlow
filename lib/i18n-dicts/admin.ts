import type { Dict } from "../i18n";

// Admin module strings. Templates containing {amt}/{cap}/{last}/{avg}/{exp}/{dev}
// are node templates — rendered via components/admin/i18nNodes `fill()` so the
// money spans keep their styling and dir="ltr". {n}/{name}/{family} are plain
// t() params.
export const adminDict: Dict = {
  en: {
    // Page shell
    "admin.lockTitle": "Admin access only",
    "admin.lockBody": "Ask a parent",
    "admin.kicker": "Admin governance",
    "admin.title": "{family} command center",
    "admin.subtitle":
      "Budgets, caps, velocity monitoring and anomaly review — every change syncs live to the whole family.",
    "admin.monitoring": "Member monitoring",

    // Shared
    "admin.overBy": "· {amt} over",
    "admin.capPlaceholder": "No cap",
    "admin.capAria": "{name} monthly cap",

    // Budget configuration card
    "admin.budget.title": "Budget configuration",
    "admin.budget.subtitle": "Family-wide budget & per-category caps",
    "admin.budget.familyMonthly": "Family monthly budget",
    "admin.budget.saveAria": "Save budget",
    "admin.budget.spentMonth": "{amt} spent this month",
    "admin.budget.left": "· {amt} left",
    "admin.budget.catSpent": "{amt} spent of {cap}",
    "admin.budget.catSpentNoCap": "{amt} spent",
    "admin.budget.uncapped": "· uncapped",
    "admin.budget.overCap": "Over cap by {amt}",

    // Member monitoring cards
    "admin.member.thisMonth": "this month",
    "admin.member.cap": "· cap {amt}",
    "admin.member.noCap": "· no cap",
    "admin.member.monthlyCap": "Monthly cap",
    "admin.member.velocity": "Last 24h {last} vs {avg}/day avg",
    "admin.member.spike": "Velocity spike",
    "admin.member.days14": "14 days ago",
    "admin.member.today": "today",

    // Anomaly review center
    "admin.anomaly.title": "Anomaly review center",
    "admin.anomaly.subtitle":
      "Recurring-charge spikes & unrecognized micro-charges",
    "admin.anomaly.open": "{n} open",
    "admin.anomaly.empty":
      "No anomalies — all recurring charges within normal bands.",
    "admin.anomaly.spikeBadge": "Recurring spike",
    "admin.anomaly.microBadge": "Unrecognized micro-charge",
    "admin.anomaly.vsExpected": "{amt} vs expected {exp} {dev}",
    "admin.anomaly.neverSeen": "{amt} at a never-seen merchant",
    "admin.anomaly.markReviewed": "Mark reviewed",

    // Governance broadcast card
    "admin.broadcast.title": "Governance broadcast",
    "admin.broadcast.subtitle":
      "Pushes instantly to every family member's device",
    "admin.broadcast.send": "Send test alert to family",
    "admin.broadcast.delivered": "Broadcast delivered",
    "admin.broadcast.recent": "Recent family alerts (all sources)",
    "admin.broadcast.empty":
      "No family alerts yet — governance rules and broadcasts will appear here.",
    "admin.broadcast.testTitle": "Governance broadcast test",
    "admin.broadcast.testBody":
      "{name} sent a test alert — if you can see this on your device, realtime family sync is working.",

    // Family members management card
    "admin.members.title": "Family members",
    "admin.members.subtitle": "Add, remove and set PINs for family profiles",
    "admin.members.you": "You",
    "admin.members.pinSet": "PIN set",
    "admin.members.passwordSet": "Password set",
    "admin.members.noPin": "One-click login",
    "admin.members.remove": "Remove",
    "admin.members.removeAria": "Remove {name}",
    "admin.members.removeConfirm": "Remove {name}?",
    "admin.members.addBtn": "Add member",
    "admin.members.name": "Name",
    "admin.members.namePh": "e.g. Noa",
    "admin.members.role": "Role",
    "admin.members.capLabel": "Monthly cap (optional)",
    "admin.members.pinLabel": "PIN (optional)",
    "admin.members.pinHint": "4–6 digits · leave empty for one-click login",
    "admin.members.pinError": "PIN must be 4–6 digits",
    "admin.members.nameError": "Name is required",
  },
  he: {
    // Page shell
    "admin.lockTitle": "הגישה למנהלים בלבד",
    "admin.lockBody": "בקשו מאחד ההורים",
    "admin.kicker": "בקרה וניהול",
    "admin.title": "מרכז הבקרה של {family}",
    "admin.subtitle":
      "תקציבים, תקרות, ניטור קצב הוצאות וסקירת חריגות — כל שינוי מסתנכרן בזמן אמת לכל המשפחה.",
    "admin.monitoring": "ניטור בני משפחה",

    // Shared
    "admin.overBy": "· חריגה של {amt}",
    "admin.capPlaceholder": "ללא תקרה",
    "admin.capAria": "תקרה חודשית — {name}",

    // Budget configuration card
    "admin.budget.title": "הגדרות תקציב",
    "admin.budget.subtitle": "תקציב משפחתי כולל ותקרות לפי קטגוריה",
    "admin.budget.familyMonthly": "תקציב משפחתי חודשי",
    "admin.budget.saveAria": "שמירת התקציב",
    "admin.budget.spentMonth": "{amt} הוצאו החודש",
    "admin.budget.left": "· נותרו {amt}",
    "admin.budget.catSpent": "הוצאו {amt} מתוך {cap}",
    "admin.budget.catSpentNoCap": "הוצאו {amt}",
    "admin.budget.uncapped": "· ללא תקרה",
    "admin.budget.overCap": "חריגה מהתקרה של {amt}",

    // Member monitoring cards
    "admin.member.thisMonth": "החודש",
    "admin.member.cap": "· תקרה {amt}",
    "admin.member.noCap": "· ללא תקרה",
    "admin.member.monthlyCap": "תקרה חודשית",
    "admin.member.velocity":
      "ב־24 השעות האחרונות {last} לעומת ממוצע יומי של {avg}",
    "admin.member.spike": "קפיצה בקצב ההוצאות",
    "admin.member.days14": "לפני 14 יום",
    "admin.member.today": "היום",

    // Anomaly review center
    "admin.anomaly.title": "מרכז סקירת חריגות",
    "admin.anomaly.subtitle": "קפיצות בחיובים קבועים וחיובי מיקרו לא מזוהים",
    "admin.anomaly.open": "{n} פתוחות",
    "admin.anomaly.empty": "אין חריגות — כל החיובים הקבועים בטווח התקין.",
    "admin.anomaly.spikeBadge": "קפיצה בחיוב קבוע",
    "admin.anomaly.microBadge": "חיוב מיקרו לא מזוהה",
    "admin.anomaly.vsExpected": "{amt} לעומת צפי של {exp} {dev}",
    "admin.anomaly.neverSeen": "{amt} אצל בית עסק לא מוכר",
    "admin.anomaly.markReviewed": "סימון כנבדק",

    // Governance broadcast card
    "admin.broadcast.title": "הפצת הודעות בקרה",
    "admin.broadcast.subtitle": "נשלחת מיידית למכשיר של כל בן משפחה",
    "admin.broadcast.send": "שליחת התראת בדיקה למשפחה",
    "admin.broadcast.delivered": "ההודעה נמסרה",
    "admin.broadcast.recent": "התראות משפחה אחרונות (מכל המקורות)",
    "admin.broadcast.empty":
      "אין עדיין התראות משפחתיות — כללי בקרה והודעות יופיעו כאן.",
    "admin.broadcast.testTitle": "בדיקת הפצת הודעות",
    "admin.broadcast.testBody":
      "{name} שלח/ה התראת בדיקה — אם אתם רואים אותה במכשיר שלכם, הסנכרון המשפחתי בזמן אמת פועל.",

    // Family members management card
    "admin.members.title": "בני המשפחה",
    "admin.members.subtitle": "הוספה והסרה של בני משפחה וניהול קודי PIN",
    "admin.members.you": "את/ה",
    "admin.members.pinSet": "PIN מוגדר",
    "admin.members.passwordSet": "סיסמה מוגדרת",
    "admin.members.noPin": "כניסה בלחיצה אחת",
    "admin.members.remove": "הסרה",
    "admin.members.removeAria": "הסרת {name}",
    "admin.members.removeConfirm": "להסיר את {name}?",
    "admin.members.addBtn": "הוספת בן משפחה",
    "admin.members.name": "שם",
    "admin.members.namePh": "למשל: נועה",
    "admin.members.role": "תפקיד",
    "admin.members.capLabel": "תקרה חודשית (לא חובה)",
    "admin.members.pinLabel": "קוד PIN (לא חובה)",
    "admin.members.pinHint": "4–6 ספרות · השאירו ריק לכניסה בלחיצה אחת",
    "admin.members.pinError": "קוד ה-PIN חייב להכיל 4–6 ספרות",
    "admin.members.nameError": "חובה להזין שם",
  },
};
