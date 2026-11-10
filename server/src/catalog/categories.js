// Category catalog: single source of truth for themes and features (web + Flutter).
// Bump CATALOG_VERSION whenever anything in this file changes (clients cache by it).
export const CATALOG_VERSION = "2026-11-10.1"

const L = (ar, fr, en, es) => ({ ar, fr, en, es })

export const AMENITIES = {
  ac: L("مكيف", "Climatisé", "Air conditioning", "Aire acondicionado"),
  wifi: L("Wi-Fi", "Wi-Fi", "Wi-Fi", "Wi-Fi"),
  kids: L("الأطفال مرحب بهم", "Enfants bienvenus", "Kids welcome", "Niños bienvenidos"),
  card: L("الأداء بالبطاقة", "Paiement par carte", "Card payment", "Pago con tarjeta"),
  parking: L("موقف سيارات", "Parking", "Parking", "Aparcamiento"),
  accessible: L("ولوج سهل", "Accès facile", "Step-free access", "Acceso adaptado"),
  towels: L("فوطة متوفرة", "Serviettes fournies", "Towels provided", "Toallas incluidas"),
  private_room: L("حمام خاص", "Hammam privatif", "Private hammam", "Hammam privado"),
  female_staff: L("طاقم نسائي", "Personnel féminin", "Female staff", "Personal femenino"),
}

const STATUS_LIGHT = { success: "#2E7D4F", warning: "#9A6416", danger: "#B42318" }
const STATUS_DARK = { success: "#4CAF7A", warning: "#E0A548", danger: "#F07167" }
const BODY_FONT = "IBM Plex Sans Arabic"

const theme = ({ mode = "light", light, dark, display, accent, radius = 12, assets = {}, priceBoard = "menu" }) => ({
  mode,
  colors: { light: { ...light, ...STATUS_LIGHT }, dark: { ...dark, ...STATUS_DARK } },
  fonts: { display, body: BODY_FONT, ...(accent ? { accent } : {}) },
  radius,
  assets: { ...assets, priceBoard },
})

export const DEFAULT_CATEGORY = {
  key: "default", value: "", labels: L("نيولوك", "NewLook", "NewLook", "NewLook"),
  features: [], styleTags: [], amenities: ["ac", "wifi", "card", "parking", "accessible"], liveStates: [],
  theme: theme({
    light: { background: "#F5FAF7", surface: "#FFFFFF", text: "#182720", muted: "#5A5F70", primary: "#267A54", onPrimary: "#FFFFFF", accent: "#7A5A1F", border: "#DCE8E1" },
    dark: { background: "#0F1813", surface: "#16221B", text: "#E6F1EB", muted: "#A6B5AD", primary: "#5CC596", onPrimary: "#0F1813", accent: "#D8B061", border: "#26362D" },
    display: "Reem Kufi",
  }),
}

export const CATEGORIES = [
  {
    key: "barber", value: "حلاقة رجالية", labels: L("حلاقة رجالية", "Barbier", "Barber", "Barbería"),
    features: ["live_status", "walkin_queue", "style_tags"],
    liveStates: ["free", "busy", "closed"],
    styleTags: [
      { key: "fade", labels: L("فيد", "Dégradé", "Fade", "Degradado") },
      { key: "classic", labels: L("كلاسيك", "Classique", "Classic", "Clásico") },
      { key: "beard", labels: L("لحية", "Barbe", "Beard", "Barba") },
      { key: "shaved", labels: L("رأس محلوق", "Rasé", "Shaved", "Rapado") },
      { key: "kids", labels: L("أطفال", "Enfants", "Kids", "Niños") },
      { key: "design", labels: L("رسم بالماكينة", "Motifs", "Hair design", "Diseños") },
    ],
    amenities: ["ac", "wifi", "kids", "card", "parking", "accessible"],
    theme: theme({
      mode: "dark", radius: 4, priceBoard: "chalkboard", display: "Reem Kufi", accent: "Special Elite",
      assets: { headerPattern: "/assets/themes/barber/pole.svg", background: "/assets/themes/barber/wood.svg" },
      light: { background: "#F4EDE4", surface: "#FFFFFF", text: "#1E1612", muted: "#5E5047", primary: "#A11D24", onPrimary: "#FFFFFF", accent: "#8A6424", border: "#D9CBBB" },
      dark: { background: "#17110E", surface: "#221A15", text: "#F3E9DC", muted: "#B8A693", primary: "#B8302F", onPrimary: "#FFFFFF", accent: "#C99A4B", border: "#3A2E26" },
    }),
  },
  {
    key: "women_salon", value: "صالون نسائي", labels: L("صالون نسائي", "Salon pour femmes", "Women's salon", "Salón de mujeres"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "wifi", "female_staff", "kids", "card", "parking", "accessible"],
    theme: theme({
      display: "El Messiri", radius: 16, priceBoard: "menu",
      light: { background: "#FBF3F4", surface: "#FFFFFF", text: "#2A1A20", muted: "#6E5560", primary: "#A3324F", onPrimary: "#FFFFFF", accent: "#9C7A2E", border: "#EBD6DB" },
      dark: { background: "#1E1418", surface: "#291C21", text: "#F6E8EC", muted: "#C9A9B4", primary: "#E07A97", onPrimary: "#1E1418", accent: "#D9B25C", border: "#44303A" },
    }),
  },
  {
    key: "hair", value: "الشعر والتصفيف", labels: L("الشعر والتصفيف", "Coiffure", "Hair styling", "Peluquería"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "wifi", "card", "parking", "accessible"],
    theme: theme({
      display: "El Messiri", radius: 14, priceBoard: "menu",
      light: { background: "#F7F4FA", surface: "#FFFFFF", text: "#1F1828", muted: "#5F5470", primary: "#6A3D9A", onPrimary: "#FFFFFF", accent: "#A0527A", border: "#E2DAEC" },
      dark: { background: "#17131D", surface: "#211B29", text: "#EEE8F5", muted: "#B9AECB", primary: "#B48BE0", onPrimary: "#17131D", accent: "#E08FB5", border: "#352C42" },
    }),
  },
  {
    key: "skincare", value: "العناية بالبشرة", labels: L("العناية بالبشرة", "Soins de la peau", "Skincare", "Cuidado de la piel"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "female_staff", "card", "parking", "accessible"],
    theme: theme({
      display: "Tajawal", radius: 18, priceBoard: "menu",
      light: { background: "#F4F7F3", surface: "#FFFFFF", text: "#18241D", muted: "#55665B", primary: "#2F6B4C", onPrimary: "#FFFFFF", accent: "#8A6A3B", border: "#D5E0D7" },
      dark: { background: "#121A15", surface: "#1A241E", text: "#E7F0E9", muted: "#A7BAAD", primary: "#7CC49C", onPrimary: "#121A15", accent: "#D2B07A", border: "#2B3A31" },
    }),
  },
  {
    key: "nails", value: "الأظافر", labels: L("الأظافر", "Ongles", "Nails", "Uñas"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["ac", "wifi", "card", "parking", "accessible"],
    theme: theme({
      display: "Lalezar", radius: 20, priceBoard: "tiles",
      light: { background: "#FFF6F2", surface: "#FFFFFF", text: "#2A1712", muted: "#6D5249", primary: "#B23A1F", onPrimary: "#FFFFFF", accent: "#7A4FA0", border: "#F0D9CF" },
      dark: { background: "#1E1411", surface: "#2A1C17", text: "#FBEAE3", muted: "#CFAFA3", primary: "#F08A6C", onPrimary: "#1E1411", accent: "#C4A3E6", border: "#46302A" },
    }),
  },
  {
    key: "hammam", value: "الحمام والسبا", labels: L("الحمام والسبا", "Hammam & spa", "Hammam & spa", "Hammam y spa"),
    features: ["crowd_status", "gender_schedule", "ritual_builder", "bring_list"],
    liveStates: ["quiet", "moderate", "crowded", "closed"],
    styleTags: [],
    amenities: ["private_room", "female_staff", "towels", "kids", "card", "parking", "accessible"],
    theme: theme({
      display: "Amiri", radius: 22, priceBoard: "menu",
      assets: { headerPattern: "/assets/themes/hammam/zellige.svg", background: "/assets/themes/hammam/zellige.svg" },
      light: { background: "#F3EBDD", surface: "#FBF6EE", text: "#2B2118", muted: "#6A5848", primary: "#8C3B1E", onPrimary: "#FFFFFF", accent: "#2F6B5E", border: "#DDCDB7" },
      dark: { background: "#1C1712", surface: "#26201A", text: "#F1E6D6", muted: "#BCA98F", primary: "#D0794F", onPrimary: "#1C1712", accent: "#6FB3A2", border: "#3B3128" },
    }),
  },
  {
    key: "makeup", value: "المكياج", labels: L("المكياج", "Maquillage", "Makeup", "Maquillaje"),
    features: [], liveStates: [], styleTags: [],
    amenities: ["female_staff", "card", "parking", "accessible"],
    theme: theme({
      display: "Aref Ruqaa", radius: 10, priceBoard: "menu",
      light: { background: "#FAF5EE", surface: "#FFFFFF", text: "#22141A", muted: "#645059", primary: "#7A1F3D", onPrimary: "#FFFFFF", accent: "#8C6A1C", border: "#E8D9C6" },
      dark: { background: "#1A1014", surface: "#24171D", text: "#F5E9EE", muted: "#C4A8B3", primary: "#D9708F", onPrimary: "#1A1014", accent: "#D4AF37", border: "#3F2A33" },
    }),
  },
]

export const categoryByValue = (value) => CATEGORIES.find((c) => c.value === value) ?? DEFAULT_CATEGORY
export const categoryByKey = (key) => CATEGORIES.find((c) => c.key === key) ?? DEFAULT_CATEGORY
export const hasFeature = (value, feature) => categoryByValue(value).features.includes(feature)

export function publicCatalog() {
  return { version: CATALOG_VERSION, amenities: AMENITIES, categories: CATEGORIES, default: DEFAULT_CATEGORY }
}
