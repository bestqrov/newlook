import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export type Lang = "ar" | "fr" | "en" | "es"
export type Label = Record<Lang, string>
export type ThemeColors = { background: string; surface: string; text: string; muted: string; primary: string; onPrimary: string; accent: string; border: string; success: string; warning: string; danger: string }
export type CategoryTheme = {
  mode: "light" | "dark"
  colors: { light: ThemeColors; dark: ThemeColors }
  fonts: { display: string; body: string; accent?: string }
  radius: number
  assets: { headerPattern?: string; background?: string; priceBoard: "chalkboard" | "menu" | "tiles" }
}
export type CategoryDef = {
  key: string; value: string; labels: Label; features: string[]; liveStates: string[]
  styleTags: { key: string; labels: Label }[]; amenities: string[]; theme: CategoryTheme
}
export type Catalog = { version: string; amenities: Record<string, Label>; categories: CategoryDef[]; default: CategoryDef }

let cache: Promise<Catalog> | null = null
export function loadCatalog(): Promise<Catalog> {
  cache ??= api<Catalog>("/api/catalog").catch((e) => { cache = null; throw e })
  return cache
}

/** The catalog, or null while loading / if the API is unreachable. */
export function useCatalog(): Catalog | null {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  useEffect(() => { let on = true; loadCatalog().then((c) => on && setCatalog(c)).catch(() => {}); return () => { on = false } }, [])
  return catalog
}

export const categoryOf = (catalog: Catalog | null, value: string): CategoryDef | null =>
  catalog ? catalog.categories.find((c) => c.value === value) ?? catalog.default : null

export const labelOf = (l: Label | undefined, lang: string) => (l ? l[(lang.slice(0, 2) as Lang)] ?? l.ar : "")
