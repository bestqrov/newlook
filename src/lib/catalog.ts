// Must stay in sync with server/src/lib/common.js (the server validates against it).
export const CATEGORIES = ["حلاقة رجالية", "صالون نسائي", "الشعر والتصفيف", "العناية بالبشرة", "الأظافر", "الحمام والسبا", "المكياج"]
export const CITIES = ["الدار البيضاء", "الرباط", "مراكش", "طنجة", "فاس", "أكادير", "وجدة", "تطوان", "مدينة أخرى"]
export const ANY_STYLE = "أي خدمة"
/** Service types offered in the search, per specialty ("" = all specialties). */
export const STYLES_BY_CATEGORY: Record<string, string[]> = {
  "": [ANY_STYLE],
  "حلاقة رجالية": [ANY_STYLE, "قصة كلاسيكية", "فيد", "تحديد اللحية", "حلاقة الرأس"],
  "صالون نسائي": [ANY_STYLE, "صبغة", "سيشوار", "قص الشعر", "تسريحة"],
  "الشعر والتصفيف": [ANY_STYLE, "قص الشعر", "صبغة", "سيشوار", "كيراتين"],
  "العناية بالبشرة": [ANY_STYLE, "تنظيف البشرة", "ماسك", "تقشير"],
  "الأظافر": [ANY_STYLE, "مانيكير", "باديكير", "جل"],
  "الحمام والسبا": [ANY_STYLE, "حمام مغربي", "مساج", "كوميرة"],
  "المكياج": [ANY_STYLE, "مكياج عروس", "مكياج سهرة"],
}

/** Loose Arabic/Latin matching: ignores case, diacritics, hamza forms, ة/ه, ى/ي and the "ال" article. */
export function normalizeText(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/(^|\s)ال/g, "$1")
    .replace(/\s+/g, " ").trim()
}
export const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240]

/** wa.me number (212XXXXXXXXX) from any Moroccan format, or "" if invalid. */
export function waNumber(raw: string | null | undefined): string {
  let p = String(raw || "").replace(/[^\d+]/g, "").replace(/^(\+|00)212/, "0")
  if (/^[5-7]\d{8}$/.test(p)) p = "0" + p
  return /^0[5-7]\d{8}$/.test(p) ? "212" + p.slice(1) : ""
}

export function waLink(phone: string | null | undefined, text: string): string {
  const n = waNumber(phone)
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : ""
}

export const isValidPhone = (p: string) => waNumber(p) !== ""
