# ResearchX 🔬

> Connecting Academic Innovation with Industry

**ResearchX** is a full-stack collaboration platform designed to bridge the gap between university research labs and corporate R&D teams. Researchers can showcase applied research, upload research papers, run AI-powered analysis on their publications, and connect with corporate R&D scouts looking for technical fits, prototypes, and industry pilot opportunities.

---

## 🌟 Key Features

- **Researcher & Corporate Profiles**: Verified academic profiles with research domains, publications, technologies, and skills, alongside corporate R&D company profiles.
- **Project & Research Paper Management**: Create, publish, archive, and manage research projects. Upload PDF research papers (up to 20 MB).
- **AI Paper Analysis (Google Gemini 3.8 Flash)**: Automatically extract structured research fields—abstract, methodology, objectives, technologies, dataset, results, and skills—directly from uploaded PDFs using Google Gemini.
- **Smart Research Matching**: Weighted similarity engine matching projects and researchers based on shared domain, keywords, technologies, skills, and research problems.
- **Industry Problem Statements**: Corporate R&D teams post technical challenges and requirements for academic researchers to review and propose solutions.
- **Private Collaboration Workspaces**: Structured member-only workspaces equipped with shared notes, external resources, task management, and activity logs.
- **Admin Verification & Control**: Admin dashboard for user verification, account activation/deactivation, and platform moderation.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router 7, Axios, Recharts, Lucide Icons | Responsive SPA layout |
| **Backend** | Python, FastAPI, Motor (Async MongoDB), Pydantic v2 | High-performance async REST API |
| **Database** | MongoDB Atlas / MongoDB Community Server | Document storage with specialized indexes |
| **AI Analysis** | Google GenAI SDK (`gemini-3.8-flash`), PyMuPDF | Structured paper extraction |
| **Security** | JWT Tokens, Password Hashing (`bcrypt`), PyJWT | Secure authentication |

---

## 📁 Repository Structure

```
ResearchX/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers & endpoints
│   │   ├── core/         # Security, CORS, and settings
│   │   ├── db/           # MongoDB Atlas setup and indexes
│   │   ├── models/       # Database schemas
│   │   ├── schemas/      # Pydantic models for validation
│   │   ├── services/     # Gemini AI, search, matching, project services
│   │   └── utils/        # Serialization and helper utilities
│   ├── create_admin.py   # Admin initialization script
│   ├── requirements.txt  # Python backend dependencies
│   └── .env.example      # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components and layout
│   │   ├── pages/        # Router pages & views
│   │   ├── services/     # Axios API integration
│   │   └── utils/        # Constants and helpers
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js    # Vite builder configuration
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites

- **Python**: 3.10+
- **Node.js**: 18+ & `npm`
- **Database**: MongoDB Atlas cluster or local MongoDB instance

---

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux/macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

5. Configure your environment variables in `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.pbwn0s9.mongodb.net/?appName=Cluster0
   MONGODB_DATABASE=researchx
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
   API_HOST=0.0.0.0
   API_PORT=8000
   JWT_SECRET_KEY=your_secure_jwt_secret_key
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ADMIN_NAME=ResearchX Admin
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_admin_password
   GEMINI_API_KEY=your_google_gemini_api_key
   GEMINI_MODEL=gemini-3.8-flash
   ```

6. Initialize the Admin Account:
   ```bash
   python create_admin.py
   ```

7. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```

4. Ensure `frontend/.env` points to your backend URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

5. Start the Vite development server:
   ```bash
   npm run dev
   ```

6. Open your browser at **[http://localhost:5173](http://localhost:5173)** (or `http://localhost:5174`).

---

## 🗄️ Database Setup (MongoDB Atlas)

To connect to MongoDB Atlas:
1. Create a cluster on [MongoDB Atlas](https://cloud.mongodb.com/).
2. Under **Security -> Network Access**, click **Add IP Address** and enable **Allow Access from Anywhere** (`0.0.0.0/0`).
3. Set your connection string as `MONGODB_URI` in `backend/.env`.

---

## 🔑 Main API Endpoints

- **Health Check**: `GET /health`
- **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Projects**: `POST /api/v1/projects`, `GET /api/v1/projects/my`, `GET /api/v1/projects/{id}`
- **PDF Upload & AI**: `POST /api/v1/projects/{id}/paper`, `POST /api/v1/projects/{id}/analyze`
- **Recommendations**: `GET /api/v1/recommendations/projects/{id}`, `GET /api/v1/recommendations/researchers/{id}`
- **Industry Problems**: `GET /api/v1/problems`, `POST /api/v1/problems`
- **Collaborations & Workspaces**: `POST /api/v1/collaboration/requests`, `GET /api/v1/workspaces`

For full interactive API documentation, run the backend and visit **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 📄 License

This project is licensed under the MIT License.
