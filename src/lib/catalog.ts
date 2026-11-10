// Must stay in sync with server/src/lib/common.js (the server validates against it).
export const CATEGORIES = ["حلاقة رجالية", "صالون نسائي", "الشعر والتصفيف", "العناية بالبشرة", "الأظافر", "الحمام والسبا", "المكياج"]
export const CITIES = ["الدار البيضاء", "الرباط", "مراكش", "طنجة", "فاس", "أكادير", "وجدة", "تطوان", "مدينة أخرى"]
export const STYLES = ["أي خدمة", "قصة كلاسيكية", "فيد", "تحديد اللحية", "حلاقة الرأس", "صبغة", "سيشوار", "مانيكير", "تنظيف البشرة"]
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
