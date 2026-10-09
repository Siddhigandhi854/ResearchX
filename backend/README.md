# ResearchX Backend

Python FastAPI service for ResearchX. MongoDB is the primary application database.

## Setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` if you use MongoDB Atlas instead of a local server:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
MONGODB_DATABASE=researchx
```

## Run

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: http://localhost:8000  
Health: http://localhost:8000/health  
Docs: http://localhost:8000/docs

## Create an admin account

Admin cannot be created through public registration.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
$env:ADMIN_NAME="ResearchX Admin"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="change_this_admin_password"
python create_admin.py
```

If those environment variables are omitted, the script prompts for name, email, and password.
