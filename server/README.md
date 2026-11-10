# NewLook API (Express + MongoDB)

Back-end of the NewLook front-end (`../src`). All business rules and security
checks run here; the browser never writes to the database directly.

## Setup

```bash
cd server
cp .env.example .env        # then fill MONGODB_URI (Atlas) and JWT_SECRET
npm install
npm run seed-plans          # default subscription plans (editable in /admin)
npm run create-admin -- you@example.com   # asks a password, prints a 2FA QR code
npm run dev                 # API on http://localhost:4000
```

In another terminal, from the project root: `npm run dev` (Vite proxies `/api`
and `/uploads` to the API).

### MongoDB Atlas
- `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/newlook?retryWrites=true&w=majority`
- Create a database user with **readWrite on the `newlook` database only**.
- Network Access: allow only your server's IP (not `0.0.0.0/0`).

## Production
- `NODE_ENV=production`, HTTPS, `TRUST_PROXY=1` behind a proxy.
- Simplest: same domain for site and API → `npm run build` at the root, then
  `SERVE_CLIENT_DIR=../dist` here. `VITE_API_URL` stays empty.
- `UPLOAD_DIR` must be on a **persistent disk** and backed up
  (`uploads/private` holds payment receipts and is never served publicly).

## Security summary
| Area | Protection |
| --- | --- |
| Sessions | JWT in httpOnly cookie, `SameSite`, revocable (`tokenVersion`) |
| Admin | Password + mandatory TOTP 2FA, enrolled offline only, 12 h sessions, audit log |
| Brute force | Rate limits, account locked 15 min after 5 failures |
| CSRF | Origin check on every write + SameSite cookies |
| Input | zod validation on every route, enums for city/category, ObjectId checks |
| Payments | Amount = plan price (server), atomic approve (no double approval), renewal extends current expiry |
| Offers / bookings | Atomic accept (one pro wins), per-business lock (no double booking), phone validation, per-phone limits, honeypot |
| Uploads | 5 MB max, real type checked by magic bytes, random names, private receipts, EXIF removed client-side |
| Headers | helmet (CSP, nosniff, frame-ancestors none) |
