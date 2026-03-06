# Deployment Plan: AI Beauty Consultant

This document outlines the steps to deploy your **FastAPI Backend on Render** and your **React Frontend on Vercel**.

## Phase 1: Backend Pre-deployment (Render)

### 1. Update MongoDB Connection
Modify `Backend/app/mongodb/client.py` to support environment variables.
```python
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Use Environment Variable for production, fallback to local for dev
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

client = MongoClient(MONGO_URI)
db = client["ai_beauty_db"]
```

### 2. Update Image URLs and API Keys
In `Backend/app/api/routes.py`, replace hardcoded `localhost` with an environment variable.
```python
# In Backend/app/api/routes.py
import os

# Get Base URL from env (e.g., https://your-backend.onrender.com)
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

# Inside analyze_face function:
image_url = f"{BASE_URL}/static/uploads/{filename}"
annotated_image_url = f"{BASE_URL}/static/uploads/{annotated_filename}"

# Update load_api_key to use standard os.getenv
def load_api_key():
    return os.getenv("OPENROUTER_API_KEY")
```

### 3. Handle Large Models on Render
Render's free tier has a 512MB RAM limit and strict size limits. Since your models are excluded from Git, you have two options:
*   **Option A (Recommended):** Host your `.h5` files on a cloud storage (like Google Drive or S3) and add a startup script to download them if they don't exist.
*   **Option B:** If the models fit within the build size (and you want to include them), remove them from `.gitignore` (not recommended for large files).

### 4. Database Setup (MongoDB Atlas)
1.  Create a free account at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2.  Create a Cluster and a Database user.
3.  In "Network Access", allow access from "0.0.0.0/0" (required for Render).
4.  Get your **Connection String**.

## Phase 2: Frontend Pre-deployment (Vercel)

### 1. Centralize API URL
Update your services (like `src/services/settingsApi.js`) to use environment variables.
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Phase 3: Deployment Steps

### Step 1: Deploy Backend to Render
1.  Push your code to GitHub.
2.  Go to [Render.com](https://render.com) and create a new **Web Service**.
3.  Connect your repository.
4.  **Settings:**
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5.  **Environment Variables:**
    *   `MONGO_URI`: Your MongoDB Atlas connection string.
    *   `OPENROUTER_API_KEY`: Your OpenRouter key.
    *   `BASE_URL`: Your Render service URL (e.g., `https://ai-beauty-api.onrender.com`).

### Step 2: Deploy Frontend to Vercel
1.  Go to [Vercel.com](https://vercel.com) and create a new project.
2.  Connect your repository and select the `Frontend/frontend` directory as the Root Directory.
3.  **Environment Variables:**
    *   `REACT_APP_API_URL`: Your Render backend URL.
4.  Deploy!

> [!IMPORTANT]
> Render's free tier "sleeps" after 15 minutes of inactivity. Initial requests might be slow.
> Also, `static/uploads` on Render is **ephemeral**. Uploaded images will be DELETED every time the server restarts.
