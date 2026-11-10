import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import multer from "multer"
import { config } from "../config.js"
import { badRequest } from "./common.js"

export const PUBLIC_DIR = path.join(config.uploadDir, "public")
export const PRIVATE_DIR = path.join(config.uploadDir, "private")

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
})

/** Detect the real type from the file's first bytes (the browser's MIME is not trusted). */
function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg"
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png"
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp"
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return "pdf"
  return null
}

/**
 * Saves an uploaded file under <dir>/<userId>/<random>.<ext>.
 * Returns the path relative to `dir`.
 */
export async function saveUpload(file, { dir, userId, allowPdf = false }) {
  if (!file?.buffer?.length) throw badRequest("file_required")
  const ext = sniff(file.buffer)
  if (!ext || (ext === "pdf" && !allowPdf)) throw badRequest("invalid_file_type")
  const rel = path.posix.join(String(userId), `${crypto.randomUUID()}.${ext}`)
  const abs = path.join(dir, rel)
  await fs.mkdir(path.dirname(abs), { recursive: true })
  await fs.writeFile(abs, file.buffer, { flag: "wx" })
  return rel
}

export async function removeUpload(dir, rel) {
  if (!rel) return
  const abs = path.resolve(dir, rel)
  if (!abs.startsWith(path.resolve(dir) + path.sep)) return // path traversal guard
  await fs.rm(abs, { force: true })
}

export function privateFile(rel) {
  const abs = path.resolve(PRIVATE_DIR, rel)
  if (!abs.startsWith(path.resolve(PRIVATE_DIR) + path.sep)) throw badRequest("invalid_path")
  return abs
}
