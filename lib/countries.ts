import { Currency } from "./format";

/**
 * Country registry for the shopping localization feature.
 * Names come from Intl.DisplayNames (localized for free, no data tables);
 * flags are derived from the ISO code via regional-indicator codepoints.
 * Each country maps to a default currency and the store chains the price
 * automation searches against.
 */

// ISO-3166 alpha-2 — full practical list, all continents.
export const COUNTRY_CODES: string[] =
  ("AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VC VE VN VU WS YE ZA ZM ZW").split(" ");

const EUROZONE = new Set(
  "AD AT BE CY DE EE ES FI FR GR HR IE IT LI LT LU LV MC ME MT NL PT SI SK SM".split(" ")
);

export function currencyForCountry(code: string): Currency {
  if (code === "IL") return "ILS";
  if (EUROZONE.has(code)) return "EUR";
  return "USD";
}

export function countryFlag(code: string): string {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export function countryName(code: string, lang: "en" | "he"): string {
  try {
    return (
      new Intl.DisplayNames([lang === "he" ? "he" : "en"], { type: "region" }).of(
        code
      ) ?? code
    );
  } catch {
    return code;
  }
}

/** Curated store chains per country — what the price automation queries. */
const STORES: Record<string, string[]> = {
  IL: ["רמי לוי", "שופרסל", "חצי חינם", "יוחננוף", "אושר עד", "ויקטורי", "טיב טעם", "קרפור ישראל"],
  US: ["Walmart", "Target", "Kroger", "Costco", "Safeway", "Amazon Fresh", "Trader Joe's"],
  GB: ["Tesco", "Sainsbury's", "ASDA", "Morrisons", "Aldi UK", "Waitrose"],
  DE: ["Aldi", "Lidl", "REWE", "Edeka", "Kaufland", "Netto"],
  FR: ["Carrefour", "E.Leclerc", "Intermarché", "Auchan", "Monoprix", "Casino"],
  ES: ["Mercadona", "Carrefour ES", "Dia", "Lidl ES", "Eroski"],
  IT: ["Coop", "Conad", "Esselunga", "Carrefour IT", "Eurospin"],
  NL: ["Albert Heijn", "Jumbo", "Lidl NL", "Plus", "Dirk"],
  RU: ["Pyaterochka", "Magnit", "Lenta", "Perekrestok"],
  IN: ["DMart", "Reliance Fresh", "JioMart", "Big Bazaar", "More"],
  CN: ["Hema Fresh", "Walmart China", "RT-Mart", "Yonghui"],
  JP: ["Aeon", "Ito-Yokado", "Seiyu", "Don Quijote", "Life"],
  KR: ["E-Mart", "Lotte Mart", "Homeplus", "Coupang"],
  TR: ["Migros", "BIM", "A101", "CarrefourSA", "ŞOK"],
  AE: ["Carrefour UAE", "Lulu Hypermarket", "Union Coop", "Spinneys"],
  BR: ["Pão de Açúcar", "Extra", "Carrefour BR", "Atacadão"],
  AU: ["Woolworths", "Coles", "Aldi AU", "IGA"],
  CA: ["Loblaws", "Sobeys", "Metro", "Costco CA", "No Frills"],
  GR: ["Sklavenitis", "AB Vassilopoulos", "Lidl GR", "My Market"],
  PL: ["Biedronka", "Lidl PL", "Carrefour PL", "Żabka"],
  UA: ["АТБ", "Сільпо", "Novus", "Ашан"],
  MX: ["Walmart MX", "Soriana", "Chedraui", "Bodega Aurrera"],
  AR: ["Coto", "Carrefour AR", "Día AR", "Jumbo AR"],
  ZA: ["Shoprite", "Pick n Pay", "Checkers", "Woolworths SA"],
  EG: ["Carrefour Egypt", "Spinneys EG", "Metro Market", "Kheir Zaman"],
  SA: ["Panda", "Carrefour KSA", "Danube", "Othaim"],
  TH: ["Big C", "Lotus's", "Makro", "Tops"],
  SG: ["FairPrice", "Cold Storage", "Giant SG", "Sheng Siong"],
};

const FALLBACK_STORES = ["Carrefour", "Amazon", "City Market", "MegaMart", "Local Grocer"];

export function storesForCountry(code: string): string[] {
  return STORES[code] ?? FALLBACK_STORES;
}

export const DEFAULT_COUNTRY = "IL";
