# ContractShield — Deployment Guide
## Stack: Vercel (Frontend) + Render (Backend) + Supabase (PostgreSQL)

---

## Overview

```
User Browser
    ↕ HTTPS
Vercel CDN  ──── serves React SPA (static, globally distributed)
    ↕ API calls (https://contractshield-backend.onrender.com/api/...)
Render.com  ──── Flask + Gunicorn + SocketIO (free web service)
    ↕ PostgreSQL (SSL)
Supabase    ──── PostgreSQL free tier (500 MB)
```

---

## Step 1 — Supabase (Database)

### 1.1 Create project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to India (e.g., `ap-southeast-1` Singapore)
3. Set a strong database password — save it somewhere safe

### 1.2 Get the connection string
1. In your project → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab and choose **Transaction pooler** (port `6543`)
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Save this — you'll paste it into Render as `DATABASE_URL`

### 1.3 Enable Row Level Security (optional but recommended)
The backend manages auth via JWT; Supabase RLS is not required but adds an extra safety layer.

---

## Step 2 — Render (Backend)

### 2.1 Push code to GitHub first
```bash
git init                        # if not already a git repo
git add .
git commit -m "Initial deployment prep"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2.2 Create Render Web Service
1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `contractshield-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && python -m spacy download en_core_web_sm` |
| **Start Command** | `gunicorn --worker-class eventlet --workers 1 --bind 0.0.0.0:$PORT --timeout 120 run:app` |
| **Instance Type** | Free |

### 2.3 Set Environment Variables in Render Dashboard
Go to your service → **Environment** tab → add these:

| Key | Value |
|-----|-------|
| `FLASK_ENV` | `production` |
| `FLASK_APP` | `run.py` |
| `DATABASE_URL` | *(paste Supabase URI from Step 1.2)* |
| `SECRET_KEY` | *(generate: `python -c "import secrets; print(secrets.token_hex(32))"`)* |
| `JWT_SECRET_KEY` | *(generate another one, different from SECRET_KEY)* |
| `GROQ_API_KEY` | *(from [console.groq.com](https://console.groq.com))* |
| `GROQ_API_URL` | `https://api.groq.com/openai/v1/chat/completions` |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` *(fill in after Step 3)* |
| `SPACY_MODEL` | `en_core_web_sm` |
| `DEBUG` | `False` |

### 2.4 Create DB tables
After first deploy via Render shell or local:
```bash
# In Render Shell (your service → Shell tab):
flask db upgrade

# Or locally with production DATABASE_URL:
DATABASE_URL="postgresql://..." flask db upgrade
```

### 2.5 Verify backend is live
```
https://contractshield-backend.onrender.com/health
# Should return: {"status": "healthy", "environment": "production"}
```

> ⚠️ **Free tier note**: Render free services **sleep after 15 min of inactivity**.
> First request after sleep takes ~30s to wake up. This is normal.

---

## Step 3 — Vercel (Frontend)

### 3.1 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.2 Set Environment Variables in Vercel Dashboard
Go to your project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://contractshield-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://contractshield-backend.onrender.com` |

> Apply to **Production**, **Preview**, and **Development** environments.

### 3.3 Redeploy with env vars
After adding env vars, go to **Deployments** → **Redeploy** (or push a commit to trigger auto deploy).

### 3.4 Get your Vercel URL
Your app will be at `https://your-project-name.vercel.app`

---

## Step 4 — Update CORS on Render

Go back to Render → your backend service → **Environment**:
- Update `CORS_ORIGINS` to your actual Vercel URL:
  ```
  https://your-project-name.vercel.app
  ```
- Click **Save Changes** — Render will redeploy automatically

---

## Step 5 — Verify Everything Works

```
1. Open https://your-project-name.vercel.app
2. Register a new account
3. Log in
4. Upload a test contract (PDF)
5. Run analysis
6. Check lawyer dashboard works
7. Check admin dashboard works
```

---

## Custom Domain (Optional)

**Vercel:**
- Project → Settings → Domains → Add your domain
- Update DNS records as shown

**Render:**
- Service → Settings → Custom Domains → Add domain
- Update DNS records

---

## Local Development (No deployment needed)

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
.\\venv\\Scripts\\activate      # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
copy .env.example .env         # then fill in values
python run.py                  # runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm install
# .env.local already has localhost URLs
npm run dev                    # runs on http://localhost:5173
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend on Render crashes on start | Check logs — likely `SECRET_KEY` or `DATABASE_URL` not set |
| `sqlalchemy.exc.OperationalError` | Check Supabase URL format — must start with `postgresql://` not `postgres://` (auto-fixed in config.py) |
| CORS errors in browser | Make sure `CORS_ORIGINS` on Render matches exact Vercel URL (no trailing slash) |
| SocketIO not connecting | Render free tier may not support persistent WebSocket — test with polling fallback |
| Uploads lost after Render redeployment | Expected — Render free tier has ephemeral filesystem. Files reset on each deploy. |
| `spacy` build fails on Render | Ensure `buildCommand` includes `python -m spacy download en_core_web_sm` |
| Render service sleeping | First request after 15min idle takes ~30s — this is a free tier limitation |
