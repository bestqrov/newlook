# NewLook (نيولوك)

Marketplace for barbers and beauty professionals in Morocco: public profiles,
online booking, "propose your price" offers, and subscriptions paid by bank
transfer.

| Part | Stack | Folder |
| --- | --- | --- |
| Front-end | React 18, Vite, TypeScript, Tailwind, shadcn/ui, i18next (ar/fr/en/es) | `src/` |
| API | Node 20, Express, Mongoose, zod | `server/` |
| Database | MongoDB Atlas | — |

## Local development

```bash
npm install
cp server/.env.example server/.env    # fill MONGODB_URI + JWT_SECRET
npm --prefix server install
npm --prefix server run seed-plans
npm --prefix server run create-admin -- you@example.com

npm run dev:api     # API  → http://localhost:4000
npm run dev         # site → http://localhost:5173 (proxies /api and /uploads)
```

## Deploy on a VPS with Coolify

The `Dockerfile` builds the site and runs the API in **one container**, so the
site and the API share one domain (no CORS, secure cookies).

1. **Coolify → New Resource → Application** from your Git repository.
   Build Pack: **Dockerfile**. Port: **4000**.
2. **Domain**: e.g. `https://newlook.ma` (Coolify issues the HTTPS certificate).
3. **Environment variables**:

   | Name | Value |
   | --- | --- |
   | `MONGODB_URI` | Atlas connection string (`mongodb+srv://…/newlook?retryWrites=true&w=majority`) |
   | `JWT_SECRET` | 64+ random characters |
   | `CLIENT_ORIGINS` | `https://newlook.ma` (your domain, comma-separated if several) |
   | `TRIAL_DAYS` | `30` (free trial for new businesses, `0` = none) |

   `NODE_ENV`, `PORT`, `TRUST_PROXY`, `UPLOAD_DIR` and `SERVE_CLIENT_DIR` are already set in the image.
4. **Persistent storage**: add a volume mounted on **`/data`**. Uploaded photos
   and payment receipts live there; without it they are lost on every redeploy.
5. **MongoDB Atlas → Network Access**: allow the VPS public IP only.
6. Deploy, then open the container terminal in Coolify once:
   ```bash
   npm run seed-plans
   npm run create-admin -- you@example.com
   ```
   Scan the QR code with Google Authenticator. The admin panel is at `/admin`.

### Backups
- Database: Atlas backups (or `mongodump` on a schedule).
- Files: back up the `/data` volume (Coolify → Backups, or rsync).

More API details and the security summary: [server/README.md](server/README.md).
