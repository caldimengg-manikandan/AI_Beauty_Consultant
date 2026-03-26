
# from fastapi import FastAPI
# from app.api.routes import router as analysis_router
# from app.api.auth_routes import router as auth_router
# from fastapi.middleware.cors import CORSMiddleware

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app = FastAPI(title="AI Beauty Consultant Backend")

# app.include_router(auth_router)
# app.include_router(analysis_router)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1️⃣ CREATE APP FIRST
app = FastAPI(
    title="AI Beauty Consultant Backend",
    version="1.0"
)

# 2️⃣ ADD MIDDLEWARE — allow localhost for dev, Vercel domain for prod
import os
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://localhost:3000",
    os.getenv("FRONTEND_URL", "*"),   # set this in Render dashboard
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 3️⃣ IMPORT ROUTERS AFTER app EXISTS
from app.api.routes import router as analysis_router
from app.api.auth_routes import router as auth_router
from app.api.settings_routes import router as settings_router
from app.api.password_routes import router as password_router
from app.api.twofa_routes import router as twofa_router
from app.api.premium_routes import router as premium_router
from app.api.appointment_routes import router as appointment_router
from app.api.virtual_routes import router as virtual_router
from app.api.admin_routes import router as admin_router
from app.api.expert_routes import router as expert_router
from app.api.routine_routes import router as routine_router
from app.api.progress_routes import router as progress_router
from app.api.report_routes import router as report_router
from app.api.onboarding_routes import router as onboarding_router
from app.api.affiliate_routes import router as affiliate_router
from app.api.notification_routes import router as notification_router
from app.api.gamification_routes import router as gamification_router
from app.api.ingredient_routes import router as ingredient_router
from app.api.translation_routes import router as translation_router

# 4️⃣ REGISTER ROUTERS
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(settings_router)
app.include_router(password_router)
app.include_router(twofa_router)
app.include_router(premium_router)
app.include_router(appointment_router)
app.include_router(virtual_router)
app.include_router(admin_router)
app.include_router(expert_router)
app.include_router(routine_router)
app.include_router(progress_router)
app.include_router(report_router)
app.include_router(onboarding_router)
app.include_router(affiliate_router)
app.include_router(notification_router)
app.include_router(gamification_router)
app.include_router(ingredient_router)
app.include_router(translation_router)

# 5️⃣ SERVE STATIC FILES (Images)
from fastapi.staticfiles import StaticFiles
import os

# Ensure static directory exists
os.makedirs("static/uploads", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Beauty Consultant Backend is Live"}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Server is running. Visit /docs for API documentation."}
