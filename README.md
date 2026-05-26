# ContractShield — AI-Powered Contract Review & Risk Analyzer

> **A full-stack AI legal-tech web application that helps anyone understand a legal contract — without needing a law degree.**

Built as a final-year (Sem 6) BSc Computer Science project. Fully deployed and live.

**Live Demo:** [contractshieldz.vercel.app](https://contractshieldz.vercel.app) &nbsp;|&nbsp; **Backend API:** [contractshield-backend-production.up.railway.app](https://contractshield-backend-production.up.railway.app)

---

## What Does It Do?

Upload any legal contract (PDF) and ContractShield will:

1. **Extract and classify every clause** using NLP
2. **Score the contract's risk level** (Low / Medium / High / Critical) out of 100
3. **Check compliance** against 15 Indian laws (Indian Contract Act 1872, IT Act 2000, etc.)
4. **Generate a plain-English summary** so non-lawyers can understand what they're signing
5. **Connect users with verified lawyers** for real-time consultation

---

## Key Features

### AI Contract Analysis
- Extracts clauses from uploaded PDFs using spaCy NLP
- Scores risk using 50+ weighted legal keywords
- Detects missing mandatory clauses (e.g. no dispute resolution, no governing law)
- Generates plain-English summaries via Groq LLM (Llama 3.3-70B)

### Indian Law Compliance Engine
- Checks 15 rules across Indian Contract Act, IT Act, Factories Act, Arbitration Act
- Gives Pass / Fail / Warning per rule with the exact law section cited
- Calculates an overall compliance score (0–100%)

### Lawyer Marketplace
- Browse verified lawyers by specialization
- Book appointments with a message
- Real-time in-app chat once appointment is approved
- Peer-to-peer audio/video calls via WebRTC (no media server needed)

### AI Legal Agent
- Conversational chat interface backed by Llama 3.3-70B (Groq)
- Answers questions about clauses, Indian law, NDAs, non-competes, and more
- Maintains conversation context across multiple turns

### Community Forum
- Reddit-style discussion board with 12 legal categories
- Upvote/downvote, nested replies, search and sort

### Admin Panel
- Approve or reject lawyer registrations
- View platform statistics and manage users

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Socket.IO Client, Recharts |
| **Backend** | Python, Flask, Flask-JWT-Extended, Flask-SocketIO |
| **Database** | PostgreSQL (hosted on Railway), SQLAlchemy ORM |
| **AI / NLP** | spaCy, PyMuPDF, Groq API (Llama 3.3-70B) |
| **Real-time** | WebRTC (P2P calls), Socket.IO (chat + signaling) |
| **Auth** | JWT with role-based access (Client / Lawyer / Admin) |
| **Deployment** | Vercel (frontend), Railway (backend + database) |

---

## How the Risk Scoring Works

Every clause is scanned for dangerous legal keywords. Each keyword hit adds weighted points:

| Risk Level | Example Keywords | Points |
|------------|-----------------|--------|
| 🔴 High | "unlimited liability", "irrevocable", "waive all rights" | +10 |
| 🟠 Medium | "indemnify", "hold harmless", "no refund" | +5 |
| 🟡 Low | "best efforts", "reasonable notice" | +2 |
| ⚪ Ambiguous | "appropriate", "timely", "forthwith" | +1 |

Final score (0–100) determines risk level: **Low → Medium → High → Critical**

---

## Database Design

11 PostgreSQL tables with full relational integrity:

- `users` → contracts → analysis results → clauses, compliance checks, missing clauses
- `users` (client) ↔ `appointments` ↔ `users` (lawyer) → chat messages
- `users` → discussion posts → comments → votes

---

## User Roles

| Role | What They Can Do |
|------|-----------------|
| **Client** | Upload contracts, view analysis, book lawyers, use AI agent |
| **Lawyer** | Manage appointments, chat and call clients (requires admin approval) |
| **Admin** | Approve lawyers, manage platform, view all data |

---

## Project Structure (simplified)

```
contractshield/
├── backend/
│   ├── app/
│   │   ├── models/        # Database models (11 tables)
│   │   ├── blueprints/    # API routes (auth, contracts, analysis, appointments...)
│   │   └── services/      # AI logic (NLP, risk scoring, compliance, Groq LLM)
│   └── run.py
└── frontend/
    └── src/
        ├── pages/         # Dashboard, Analysis, Upload, LawyerDashboard, Forum...
        ├── components/    # WebRTC call modal, payment QR, profile editor
        └── context/       # Auth state, call state (Socket.IO)
```

---

## Running Locally

**Backend**
```bash
git clone <repo-url>
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
# Add your .env file (DATABASE_URL, GROQ_API_KEY, JWT_SECRET_KEY)
flask db upgrade
python run.py
```

**Frontend**
```bash
cd frontend
npm install
# Set VITE_API_BASE_URL in .env.local
npm run dev
```

You need a free [Groq API key](https://console.groq.com) and a PostgreSQL database (Railway free tier works).

---

## What I Learned Building This

- End-to-end full-stack development with a real relational database schema
- Integrating NLP (spaCy) and LLMs (Groq) into a production pipeline
- Building WebRTC peer-to-peer calls with Socket.IO signaling
- JWT authentication with multi-role access control
- Production deployment with CI/CD via GitHub → Vercel + Railway

---

*Built for the Indian legal-tech space as a BSc CS final year project. Legal disclaimer: AI analysis does not constitute legal advice.*
