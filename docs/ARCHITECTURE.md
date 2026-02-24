# Smart Contract Review & Risk Analyzer - System Architecture

## 🎯 Project Overview

An AI-powered contract analysis system that uses NLP and rule-based engines to detect risks, missing clauses, ambiguities, and compliance issues under Indian legal principles.

**Academic Focus**: Demonstrates practical application of NLP, rule-based AI, and full-stack development.

**Legal Disclaimer**: This system provides AI-assisted analysis and does not constitute legal advice. Users should consult qualified legal professionals for legal matters.

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Frontend (Vercel)                                  │   │
│  │  - Authentication UI                                      │   │
│  │  - Contract Upload Interface                              │   │
│  │  - Analysis Dashboard                                     │   │
│  │  - Risk Visualization (Chart.js)                          │   │
│  │  - Comparison View                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Flask Backend (Render)                                   │   │
│  │  ┌────────────┬────────────┬────────────┬──────────────┐ │   │
│  │  │   Auth     │  Contract  │  Analysis  │   Report     │ │   │
│  │  │  Blueprint │  Blueprint │  Blueprint │  Blueprint   │ │   │
│  │  └────────────┴────────────┴────────────┴──────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      AI/NLP PROCESSING LAYER                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NLP Engine (spaCy + NLTK)                                │   │
│  │  - Clause Extraction                                      │   │
│  │  - Entity Recognition                                     │   │
│  │  - Sentence Segmentation                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Rule-Based Engine                                        │   │
│  │  - Risk Detection                                         │   │
│  │  - Compliance Checking                                    │   │
│  │  - Missing Clause Detection                               │   │
│  │  - Ambiguity Detection                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  LLM Integration (Optional - Groq API)                    │   │
│  │  - Clause Explanation                                     │   │
│  │  - Summarization                                          │   │
│  │  - Fallback: Rule-based explanation                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database (Supabase)                           │   │
│  │  - Users & Authentication                                 │   │
│  │  - Contracts & Versions                                   │   │
│  │  - Analysis Results                                       │   │
│  │  - Risk Scores & Clauses                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Technology Stack

### Frontend
- **Framework**: React 18+ with Hooks
- **Styling**: Tailwind CSS
- **Visualization**: Chart.js / Recharts
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Routing**: React Router v6
- **PWA**: Workbox for service workers

### Backend
- **Framework**: Flask 3.x
- **Architecture**: Blueprint-based modular structure
- **Authentication**: Flask-JWT-Extended
- **Password Hashing**: bcrypt
- **CORS**: Flask-CORS
- **Database ORM**: SQLAlchemy
- **Migrations**: Flask-Migrate
- **PDF Processing**: pdfplumber / PyPDF2

### AI/NLP
- **NLP Library**: spaCy (en_core_web_sm)
- **Text Processing**: NLTK
- **Similarity**: difflib (built-in)
- **Optional LLM**: Groq API (free tier)

### Database
- **Production**: PostgreSQL (Supabase free tier)
- **Development**: SQLite
- **ORM**: SQLAlchemy

### Deployment
- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **Database**: Supabase (free PostgreSQL)
- **File Storage**: Local filesystem (within Render limits)

---

## 📁 Project Structure

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py                 # Flask app factory
│   ├── config.py                   # Configuration management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                 # User model
│   │   ├── contract.py             # Contract model
│   │   ├── analysis.py             # Analysis result model
│   │   └── clause.py               # Clause model
│   ├── blueprints/
│   │   ├── __init__.py
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── routes.py           # Auth endpoints
│   │   ├── contracts/
│   │   │   ├── __init__.py
│   │   │   └── routes.py           # Contract CRUD
│   │   ├── analysis/
│   │   │   ├── __init__.py
│   │   │   └── routes.py           # Analysis endpoints
│   │   └── reports/
│   │       ├── __init__.py
│   │       └── routes.py           # Report generation
│   ├── services/
│   │   ├── __init__.py
│   │   ├── nlp_service.py          # NLP processing (AI #1)
│   │   ├── risk_service.py         # Risk detection (AI #2)
│   │   ├── compliance_service.py   # Compliance checking
│   │   ├── explanation_service.py  # Plain English (AI #3)
│   │   ├── comparison_service.py   # Contract comparison
│   │   └── llm_service.py          # Groq integration
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── pdf_extractor.py        # PDF text extraction
│   │   ├── validators.py           # Input validation
│   │   └── decorators.py           # Custom decorators
│   └── data/
│       ├── risk_keywords.json      # Risk detection rules
│       ├── compliance_rules.json   # Indian legal rules
│       └── mandatory_clauses.json  # Required clauses
├── migrations/                      # Database migrations
├── tests/
│   ├── __init__.py
│   ├── test_auth.py
│   ├── test_analysis.py
│   └── test_nlp.py
├── requirements.txt
├── .env.example
├── run.py                          # Application entry point
└── README.md
```

### Frontend Structure
```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json               # PWA manifest
│   ├── service-worker.js           # PWA service worker
│   └── icons/                      # PWA icons
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contracts/
│   │   │   ├── ContractUpload.jsx
│   │   │   ├── ContractList.jsx
│   │   │   └── ContractViewer.jsx
│   │   ├── analysis/
│   │   │   ├── AnalysisDashboard.jsx
│   │   │   ├── RiskHeatmap.jsx
│   │   │   ├── ClauseList.jsx
│   │   │   ├── MissingClauses.jsx
│   │   │   └── ComplianceReport.jsx
│   │   └── comparison/
│   │       └── ContractComparison.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx         # Authentication state
│   ├── services/
│   │   └── api.js                  # Axios API client
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   └── index.css               # Tailwind imports
│   ├── App.jsx
│   ├── index.jsx
│   └── routes.jsx
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── README.md
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'lawyer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Contracts Table
```sql
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    extracted_text TEXT,
    version INTEGER DEFAULT 1,
    parent_contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'analyzed', 'error')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Analysis Results Table
```sql
CREATE TABLE analysis_results (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    overall_risk_score DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    completeness_score DECIMAL(5,2) NOT NULL,
    compliance_status VARCHAR(50) NOT NULL,
    total_clauses INTEGER NOT NULL,
    flagged_clauses INTEGER NOT NULL,
    missing_clauses INTEGER NOT NULL,
    analysis_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Clauses Table
```sql
CREATE TABLE clauses (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    clause_type VARCHAR(100) NOT NULL,
    clause_text TEXT NOT NULL,
    clause_position INTEGER NOT NULL,
    risk_level VARCHAR(50) CHECK (risk_level IN ('none', 'low', 'medium', 'high')),
    risk_explanation TEXT,
    plain_explanation TEXT,
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reasons JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Missing Clauses Table
```sql
CREATE TABLE missing_clauses (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    clause_name VARCHAR(255) NOT NULL,
    clause_category VARCHAR(100) NOT NULL,
    importance VARCHAR(50) NOT NULL CHECK (importance IN ('mandatory', 'recommended', 'optional')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Compliance Checks Table
```sql
CREATE TABLE compliance_checks (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_reference VARCHAR(500),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pass', 'fail', 'warning')),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 REST API Design

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "client"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response:**
```json
{
  "success": true,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "client"
  }
}
```

### Contract Endpoints

#### POST /api/contracts/upload
**Request:** (multipart/form-data)
```
file: [PDF/TXT file]
title: "Employment Agreement"
```
**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "title": "Employment Agreement",
    "file_name": "employment_agreement.pdf",
    "status": "uploaded",
    "created_at": "2026-02-16T22:23:41Z"
  }
}
```

#### GET /api/contracts
**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": 1,
      "title": "Employment Agreement",
      "status": "analyzed",
      "created_at": "2026-02-16T22:23:41Z",
      "risk_score": 65.5
    }
  ]
}
```

#### GET /api/contracts/:id
**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "title": "Employment Agreement",
    "file_name": "employment_agreement.pdf",
    "extracted_text": "This agreement is made...",
    "status": "analyzed",
    "version": 1,
    "created_at": "2026-02-16T22:23:41Z"
  }
}
```

### Analysis Endpoints

#### POST /api/analysis/analyze/:contract_id
**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": 1,
    "contract_id": 1,
    "overall_risk_score": 65.5,
    "risk_level": "medium",
    "completeness_score": 78.0,
    "compliance_status": "partial",
    "total_clauses": 12,
    "flagged_clauses": 3,
    "missing_clauses": 2,
    "processing_time": 2.34
  }
}
```

#### GET /api/analysis/:analysis_id/clauses
**Response:**
```json
{
  "success": true,
  "clauses": [
    {
      "id": 1,
      "clause_type": "payment",
      "clause_text": "Payment shall be made within 30 days...",
      "clause_position": 1,
      "risk_level": "low",
      "risk_explanation": "Standard payment terms",
      "plain_explanation": "You will be paid within 30 days",
      "is_flagged": false
    },
    {
      "id": 2,
      "clause_type": "liability",
      "clause_text": "The contractor assumes unlimited liability...",
      "clause_position": 5,
      "risk_level": "high",
      "risk_explanation": "Unlimited liability exposes you to significant financial risk",
      "plain_explanation": "You could be responsible for any damages without limit",
      "is_flagged": true,
      "flagged_reasons": ["unlimited_liability", "no_cap"]
    }
  ]
}
```

#### GET /api/analysis/:analysis_id/missing-clauses
**Response:**
```json
{
  "success": true,
  "missing_clauses": [
    {
      "clause_name": "Dispute Resolution",
      "clause_category": "legal",
      "importance": "mandatory",
      "description": "Specifies how disputes will be resolved"
    }
  ]
}
```

#### GET /api/analysis/:analysis_id/compliance
**Response:**
```json
{
  "success": true,
  "compliance_checks": [
    {
      "rule_name": "Notice Period Requirement",
      "rule_reference": "Indian Contract Act, 1872 - Section 27",
      "status": "pass",
      "explanation": "Contract includes valid notice period clause"
    },
    {
      "rule_name": "Electronic Signature Validity",
      "rule_reference": "IT Act, 2000 - Section 3",
      "status": "warning",
      "explanation": "Contract should specify acceptance of electronic signatures"
    }
  ]
}
```

### Comparison Endpoints

#### POST /api/comparison/compare
**Request:**
```json
{
  "contract_id_1": 1,
  "contract_id_2": 2
}
```
**Response:**
```json
{
  "success": true,
  "comparison": {
    "added_clauses": 3,
    "removed_clauses": 1,
    "modified_clauses": 2,
    "risk_score_change": -5.5,
    "differences": [
      {
        "type": "modified",
        "clause_type": "payment",
        "old_text": "Payment within 30 days",
        "new_text": "Payment within 45 days",
        "impact": "medium"
      }
    ]
  }
}
```

---

## 🤖 AI/NLP Components Explained

### AI Component #1: Clause Extraction (NLP)

**Technology**: spaCy sentence segmentation + rule-based classification

**How it works:**
1. **Text Preprocessing**: Clean extracted text, remove extra whitespace
2. **Sentence Segmentation**: Use spaCy's `en_core_web_sm` model to split text into sentences
3. **Clause Detection**: Identify clause boundaries using:
   - Numbered/lettered patterns (1., a., i., etc.)
   - Heading patterns (ALL CAPS, bold markers)
   - Keyword triggers ("WHEREAS", "NOW THEREFORE", etc.)
4. **Clause Classification**: Categorize using keyword matching:
   - **Payment**: "payment", "compensation", "salary", "fee"
   - **Termination**: "terminate", "termination", "notice period"
   - **Confidentiality**: "confidential", "non-disclosure", "proprietary"
   - **Liability**: "liability", "indemnify", "damages"
   - **Jurisdiction**: "jurisdiction", "governing law", "arbitration"

**Academic Justification**: Demonstrates practical NLP application using linguistic features (sentence boundaries, named patterns) combined with domain knowledge.

### AI Component #2: Risk & Ambiguity Detection (Rule-Based AI)

**Technology**: Keyword-based pattern matching with severity scoring

**How it works:**
1. **Risk Keyword Database**: JSON file with categorized risk indicators
2. **Pattern Matching**: Search for risk keywords in each clause
3. **Severity Classification**:
   - **High Risk**: "unlimited liability", "perpetual", "irrevocable", "waive all rights"
   - **Medium Risk**: "indemnify", "hold harmless", "sole discretion", "no warranty"
   - **Low Risk**: "best efforts", "reasonable notice", "subject to approval"
4. **Ambiguity Detection**: Flag vague terms:
   - "reasonable", "appropriate", "timely", "substantial", "material"
5. **Contextual Scoring**: Weight based on clause type and position

**Academic Justification**: Shows rule-based AI system design, knowledge engineering, and decision logic implementation.

### AI Component #3: Plain-English Explanation (Hybrid AI)

**Technology**: Two-layer system with fallback

**Layer 1 - Rule-Based (Always Available):**
- Template-based simplification
- Keyword replacement dictionary
- Sentence structure simplification
- Example: "The party of the first part shall indemnify..." → "You must compensate..."

**Layer 2 - LLM-Enhanced (Optional - Groq API):**
- Send clause to Groq's Llama 3 model
- Prompt: "Explain this legal clause in simple English for a non-lawyer"
- Fallback to Layer 1 if API unavailable or quota exceeded

**Academic Justification**: Demonstrates integration of traditional AI (rules) with modern AI (LLMs), with practical fallback mechanisms.

---

## 🇮🇳 Indian Legal Compliance Rules

### Implemented Compliance Checks

1. **Indian Contract Act, 1872**
   - Section 10: Essential elements of valid contract
   - Section 23: Lawful consideration and object
   - Section 27: Restraint of trade restrictions
   - Section 73: Compensation for breach

2. **Information Technology Act, 2000**
   - Section 3: Electronic signature validity
   - Section 4: Legal recognition of electronic records
   - Section 65: Electronic evidence admissibility

3. **Employment-Specific Checks**
   - Notice period clarity (minimum 30 days for senior positions)
   - Wage payment terms (Payment of Wages Act, 1936)
   - Working hours compliance (Factories Act, 1948)
   - Non-compete clause reasonableness

### Implementation Approach

**Rule-Based Checklist System:**
```json
{
  "rule_id": "ICA_1872_S27",
  "rule_name": "Restraint of Trade",
  "keywords": ["non-compete", "restraint", "restriction"],
  "check_logic": "duration_check",
  "max_duration_months": 12,
  "severity": "high"
}
```

**Note**: This is a simplified academic implementation. Production systems would require comprehensive legal database integration.

---

## 🚀 Deployment Architecture

### Free-Tier Hosting Strategy

**Frontend (Vercel)**
- Automatic CI/CD from Git
- Global CDN
- HTTPS included
- Custom domain support
- Limits: 100GB bandwidth/month

**Backend (Render)**
- Free tier: 512MB RAM, shared CPU
- Auto-sleep after 15 min inactivity
- 750 hours/month free
- Strategy: Use lightweight models, optimize memory

**Database (Supabase)**
- Free tier: 500MB database
- 2GB file storage
- 50,000 monthly active users
- Automatic backups

**File Storage**
- Store uploaded contracts in Render's ephemeral filesystem
- For persistence: Use Supabase Storage (2GB free)

### Performance Optimization for Free Tier

1. **Lazy Loading**: Load spaCy model only when needed
2. **Caching**: Cache analysis results in database
3. **Async Processing**: Use background tasks for heavy analysis
4. **Model Selection**: Use smallest spaCy model (en_core_web_sm)
5. **Connection Pooling**: Reuse database connections

---

## 📱 PWA Conversion Strategy

### Making Frontend Installable on Android

1. **Create manifest.json**:
```json
{
  "name": "Smart Contract Analyzer",
  "short_name": "ContractAI",
  "description": "AI-powered contract risk analysis",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. **Service Worker** (for offline capability):
```javascript
// Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('contract-analyzer-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/css/main.css',
        '/static/js/main.js'
      ]);
    })
  );
});
```

3. **Add to index.html**:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#4F46E5">
```

4. **Register Service Worker**:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

---

## 🎓 Academic Evaluation Tips

### Maximizing Project Impact

1. **Clear AI/NLP Demonstration**:
   - Prepare slides showing spaCy's sentence segmentation
   - Demonstrate clause extraction with visual examples
   - Show before/after of plain-English conversion

2. **Rule-Based AI Justification**:
   - Explain why rule-based approach is appropriate for legal domain
   - Show the risk keyword database
   - Demonstrate scoring algorithm

3. **System Design Excellence**:
   - Highlight modular architecture
   - Show clean separation of concerns
   - Demonstrate scalability considerations

4. **Indian Legal Context**:
   - Prepare summary of implemented compliance rules
   - Show how rules are encoded in system
   - Demonstrate compliance checking with examples

5. **Production-Ready Features**:
   - Role-based access control
   - Version history tracking
   - Comprehensive error handling
   - Security best practices (JWT, bcrypt)

6. **Live Demo Preparation**:
   - Prepare 2-3 sample contracts (employment, NDA, service agreement)
   - Show complete flow: upload → analysis → visualization
   - Demonstrate comparison feature
   - Show mobile PWA installation

7. **Technical Depth**:
   - Be ready to explain spaCy pipeline
   - Understand JWT authentication flow
   - Explain database normalization choices
   - Discuss free-tier optimization strategies

### Viva Questions to Prepare For

1. "Why did you choose spaCy over other NLP libraries?"
2. "How does your risk scoring algorithm work?"
3. "What are the limitations of rule-based approach?"
4. "How would you scale this to handle 10,000 users?"
5. "What Indian legal acts did you reference and why?"
6. "How does JWT authentication work?"
7. "What happens if the Groq API is unavailable?"
8. "How do you handle PDF extraction errors?"

---

## 🔒 Security Considerations

1. **Authentication**: JWT with secure secret key
2. **Password Storage**: bcrypt hashing (12 rounds)
3. **Input Validation**: Sanitize all user inputs
4. **File Upload**: Validate file types and sizes
5. **SQL Injection**: Use SQLAlchemy ORM (parameterized queries)
6. **CORS**: Restrict to frontend domain only
7. **Rate Limiting**: Implement on analysis endpoints
8. **Environment Variables**: Never commit secrets to Git

---

## 📊 Success Metrics

### Functional Requirements
- ✅ User authentication with role-based access
- ✅ PDF/TXT contract upload and processing
- ✅ Clause extraction and classification
- ✅ Risk detection and scoring
- ✅ Missing clause identification
- ✅ Compliance checking (Indian law)
- ✅ Plain-English explanation
- ✅ Contract comparison
- ✅ Visual dashboard with charts
- ✅ PWA support for mobile

### Technical Requirements
- ✅ Modular Flask backend
- ✅ React frontend with Tailwind
- ✅ PostgreSQL database
- ✅ spaCy + NLTK integration
- ✅ Optional Groq LLM integration
- ✅ Free-tier deployment ready
- ✅ Clean, documented code

### Academic Requirements
- ✅ Clear AI/NLP components
- ✅ Indian legal context
- ✅ Production-like architecture
- ✅ Scalable design
- ✅ Comprehensive documentation

---

## 📚 Next Steps

1. Review this architecture document
2. Set up development environment
3. Implement backend (Flask + NLP services)
4. Implement frontend (React + Tailwind)
5. Create sample contracts for testing
6. Deploy to free-tier services
7. Prepare demo and presentation
8. Practice viva questions

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-16  
**Author**: AI Assistant for Academic Project
