/**
 * Re-encodes a photo in the browser before upload:
 *  - removes EXIF metadata (GPS location, phone model…)
 *  - fixes rotation and shrinks it to `maxEdge` px
 * Returns a JPEG File. Throws "invalid_image" if the file is not a readable image.
 */
export async function sanitizeImage(file: File, maxEdge = 1600, quality = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("invalid_image")
  let bmp: ImageBitmap
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions) } catch { throw new Error("invalid_image") }
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bmp.width * scale))
  canvas.height = Math.max(1, Math.round(bmp.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("invalid_image")
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close?.()
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality))
  if (!blob) throw new Error("invalid_image")
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
}
