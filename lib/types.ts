export type Role = "admin" | "member";

export type CategoryId = "food" | "leisure" | "fixed" | "mandatory";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  color: string; // css var reference
  emoji: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "food", label: "Food & Groceries", color: "var(--cat-food)", emoji: "🛒" },
  { id: "leisure", label: "Leisure & Entertainment", color: "var(--cat-leisure)", emoji: "🎬" },
  { id: "fixed", label: "Fixed Costs", color: "var(--cat-fixed)", emoji: "🏠" },
  { id: "mandatory", label: "Mandatory Commitments", color: "var(--cat-mandatory)", emoji: "📌" },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, CategoryDef>;

export interface StoredCredential {
  salt: string;
  hash: string;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  color: string; // avatar hue
  monthlyCap: number | null; // admin-configured spending cap, null = uncapped
  email?: string; // admins sign in with email + password
  credential?: StoredCredential; // salted password hash (admins)
  pinCredential?: StoredCredential; // salted PIN hash (members)
}

export type TxSource = "manual" | "scan" | "payment";

export interface Transaction {
  id: string;
  memberId: string;
  amount: number; // positive = expense
  category: CategoryId;
  label: string; // merchant / item name
  note?: string;
  ts: number; // epoch ms
  source: TxSource;
  items?: ReceiptItem[]; // present for scanned receipts
}

export interface ReceiptItem {
  name: string;
  price: number;
  historicalPrice?: number | null;
  matched?: boolean;
}

export type AlertKind = "budget" | "velocity" | "anomaly" | "savings" | "runway" | "payment";

export interface FamAlert {
  id: string;
  kind: AlertKind;
  severity: "info" | "warn" | "critical";
  title: string;
  body: string;
  memberId?: string;
  ts: number;
  read: boolean;
}

export interface WalletCard {
  id: string;
  memberId: string;
  brand: "visa" | "mastercard" | "amex";
  last4: string;
  expMonth: number;
  expYear: number;
  token: string; // mock Stripe token
  createdAt: number;
}

export interface FamilySettings {
  familyName: string;
  currency: string; // "USD"
  monthlyBudget: number; // family-wide budget
  categoryCaps: Record<CategoryId, number | null>;
}

export interface LedgerState {
  members: Member[];
  transactions: Transaction[];
  alerts: FamAlert[];
  cards: WalletCard[];
  settings: FamilySettings;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
