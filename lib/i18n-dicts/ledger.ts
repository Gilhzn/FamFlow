import type { Dict } from "../i18n";

export const ledgerDict: Dict = {
  en: {
    "ledger.title": "Family Ledger",
    "ledger.subtitle": "Every purchase, synced live across the family.",

    // Quick-add bar
    "ledger.amount": "Amount",
    "ledger.amountPlaceholder": "0.00",
    "ledger.labelPlaceholder": "What was it? e.g. Groceries at Wholemart",
    "ledger.category": "Category",
    "ledger.addTx": "Add transaction",

    // Filters
    "ledger.searchPlaceholder": "Search label or note…",
    "ledger.searchAria": "Search transactions",
    "ledger.clearSearch": "Clear search",
    "ledger.resultsOne": "1 transaction",
    "ledger.results": "{n} transactions",
    "ledger.clearFilters": "Clear filters",

    // Day groups
    "ledger.today": "Today",
    "ledger.yesterday": "Yesterday",

    // Empty states
    "ledger.emptyTitle": "No transactions yet",
    "ledger.emptyBody":
      "Add your first purchase with the quick-add bar above — it syncs to every family member instantly.",
    "ledger.noMatchTitle": "Nothing matches these filters",
    "ledger.noMatchBody": "Try a different member, category, or search term.",

    "ledger.showMore": "Show more ({n} older)",

    // Transaction row
    "ledger.source.manual": "Manual entry",
    "ledger.source.scan": "Scanned receipt",
    "ledger.source.payment": "Card payment",
    "ledger.deleteTx": "Delete transaction",
    "ledger.confirmDelete": "Confirm delete",
    "ledger.deleteConfirm": "Delete?",
    "ledger.vsUsual": "vs usual",
    "ledger.historyMatch": "History match: {price}",

    // Undo toast
    "ledger.deleted": "Deleted “{label}”",
    "ledger.removedForEveryone": "removed for everyone",
    "ledger.undo": "Undo",
    "ledger.dismiss": "Dismiss",
  },
  he: {
    "ledger.title": "הלדג'ר המשפחתי",
    "ledger.subtitle": "כל רכישה מסתנכרנת בזמן אמת אצל כל בני המשפחה.",

    // Quick-add bar
    "ledger.amount": "סכום",
    "ledger.amountPlaceholder": "0.00",
    "ledger.labelPlaceholder": "מה קניתם? לדוגמה: קניות בסופרמרקט",
    "ledger.category": "קטגוריה",
    "ledger.addTx": "הוספת עסקה",

    // Filters
    "ledger.searchPlaceholder": "חיפוש לפי תיאור או הערה…",
    "ledger.searchAria": "חיפוש עסקאות",
    "ledger.clearSearch": "ניקוי החיפוש",
    "ledger.resultsOne": "עסקה אחת",
    "ledger.results": "{n} עסקאות",
    "ledger.clearFilters": "ניקוי מסננים",

    // Day groups
    "ledger.today": "היום",
    "ledger.yesterday": "אתמול",

    // Empty states
    "ledger.emptyTitle": "אין עסקאות עדיין",
    "ledger.emptyBody":
      "הוסיפו את הרכישה הראשונה בסרגל ההוספה המהירה שלמעלה — היא תסתנכרן מיידית אצל כל בני המשפחה.",
    "ledger.noMatchTitle": "אין תוצאות למסננים שנבחרו",
    "ledger.noMatchBody": "נסו בן משפחה אחר, קטגוריה אחרת או מונח חיפוש אחר.",

    "ledger.showMore": "הצגת עוד ({n} ישנות יותר)",

    // Transaction row
    "ledger.source.manual": "רישום ידני",
    "ledger.source.scan": "קבלה סרוקה",
    "ledger.source.payment": "תשלום בכרטיס",
    "ledger.deleteTx": "מחיקת עסקה",
    "ledger.confirmDelete": "אישור מחיקה",
    "ledger.deleteConfirm": "למחוק?",
    "ledger.vsUsual": "לעומת המחיר הרגיל",
    "ledger.historyMatch": "התאמה היסטורית: {price}",

    // Undo toast
    "ledger.deleted": "העסקה “{label}” נמחקה",
    "ledger.removedForEveryone": "הוסר אצל כל בני המשפחה",
    "ledger.undo": "שחזור",
    "ledger.dismiss": "סגירה",
  },
};
