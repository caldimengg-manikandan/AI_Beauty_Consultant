# AI Beauty Consultant 💄✨

> An intelligent, AI-powered beauty analysis platform that provides personalized skincare recommendations, face shape analysis, and styling suggestions using computer vision and (optionally) trained deep-learning models.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![React](https://img.shields.io/badge/react-19.0+-61dafb.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.110+-009688.svg)

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Machine Learning Models](#machine-learning-models)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About the Project

**AI Beauty Consultant** is a comprehensive beauty analysis platform that combines computer vision, deep learning, and a rules-based recommendation engine to give users personalized skincare, hairstyle, and makeup guidance from a single uploaded photo.

### Key Objectives

- **Personalized Analysis**: Skin and face-shape analysis from an uploaded photo
- **Transparency**: The app reports *how* a result was produced (trained model vs. geometric/heuristic fallback) and a confidence score, instead of presenting every result as equally certain
- **Comprehensive Recommendations**: Skincare, hair, and makeup suggestions, plus an AI chat consultant
- **Operational safety**: Designed to run reliably on small, memory-constrained hosting (see [Machine Learning Models](#machine-learning-models))

### Target Users

- Beauty enthusiasts seeking personalized recommendations
- Individuals wanting to understand their skin type and concerns
- People looking for hairstyle and makeup suggestions
- Beauty professionals/salons using the platform for client consultations and bookings

---

## ✨ Features

### 🔍 Core Features

#### 1. **Face & Skin Analysis**
- Upload a photo for AI-assisted skin and face-shape analysis
- Face shape classification (Oval, Round, Square, Heart, Diamond, Long, Pear, Triangle)
- Skin condition scoring (acne, oiliness, and related concerns)
- Confidence score and **model/method badge** shown with every result, so it's clear whether a trained model or a geometric/heuristic fallback produced it
- Multi-face detection: if more than one face is found, the app analyzes the primary/largest face and flags this in the result
- Image quality gate with explicit guidance (lighting, blur, framing) before and after analysis

#### 2. **Color & Style Analysis**
- Skin tone, undertone, eye color, and hair color detection
- Seasonal color palette and personalized product/shade tips

#### 3. **AI Consultant Chat**
- Conversational beauty consultant backed by an LLM (OpenRouter), with a local rules-based fallback if no LLM is available

#### 4. **Personalized Recommendations**
- Skincare routine and product suggestions based on detected skin profile
- Hairstyle and nail styling suggestions based on face shape and skin tone

#### 5. **Salon & Booking Features**
- Salon directory, appointment booking, staff scheduling, loyalty/gamification, coupons, and e-commerce/order flows

#### 6. **Accounts & Security**
- JWT-based authentication with refresh tokens, role-based access control (RBAC), and optional two-factor authentication (TOTP via `pyotp`)

### 🎨 UI/UX Features

- **Modern Design**: Purple & Teal color scheme with glassmorphism effects
- **Smooth Animations**: Staggered fade-ins, hover effects, and transitions
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Progress feedback**: Multi-stage progress indicator during analysis instead of a single generic spinner
- **Categorized errors**: Errors are labeled as "Retryable" (bad photo, network blip) vs. "Account action needed" (session expired, usage limit) so the UI doesn't offer a misleading "Try Again" button when retrying won't help

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **React Router 7** | Client-side routing |
| **Vite** | Dev server / build tool |
| **Tailwind CSS** | Styling |
| **MediaPipe** (`@mediapipe/face_mesh`, `@mediapipe/tasks-vision`, etc.) | In-browser face mesh / live camera face detection |
| **Axios** | HTTP client |
| **react-i18next** | Internationalization |
| **Framer Motion / React Icons / Recharts** | Animation, icons, charts |

### Backend

| Technology | Purpose |
|------------|---------|
| **Python 3.10+** | Core language |
| **FastAPI** + **Uvicorn** | Async REST API framework / ASGI server |
| **PyTorch + torchvision** | Face-shape classifier (EfficientNetV2-S), loaded lazily and only on hosts with enough RAM |
| **TensorFlow / Keras** | Skin classifier (DenseNet-201, `.h5`), loaded lazily and only on hosts with enough RAM |
| **OpenCV (headless)** | Image preprocessing, heuristic/geometric analysis fallback |
| **MediaPipe (Python)** | Face landmark detection (468-point face mesh) |
| **MongoDB** (via `pymongo`) | Primary datastore (users, analyses, bookings, etc.) |
| **python-jose + passlib/argon2-cffi + pyotp** | JWT auth, password hashing, TOTP 2FA |
| **Razorpay** | Payment processing |
| **psutil** | Runtime memory checks that gate heavy model loading (see below) |

> **Note on the previous version of this README**: earlier drafts described this project as Flask + TensorFlow + Haar Cascade/MTCNN with no database. That description was out of date. The backend has since moved to **FastAPI + PyTorch/TensorFlow + MediaPipe + MongoDB**, with JWT/RBAC/2FA auth and a much larger feature set (payments, salon marketplace, loyalty, gamification). This document reflects the current stack.

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│                  (React 19 + Vite Frontend)                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Dashboard  │  │  Analysis  │  │  History   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │ REST (JSON / multipart)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      REST API LAYER                          │
│                  (FastAPI + Uvicorn Backend)                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Routes   │  │  RBAC/2FA  │  │ JWT Auth   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ML/CV PROCESSING LAYER                      │
│  ┌────────────────┐ ┌──────────────────┐ ┌────────────────┐ │
│  │ MediaPipe Face │ │ Skin Model       │ │ Face-Shape     │ │
│  │ Mesh Detection │ │ (DenseNet-201,   │ │ Model          │ │
│  │ + Quality Gate │ │  TF, optional)   │ │ (EfficientNet  │ │
│  │                │ │ → CV heuristic   │ │  V2-S, PyTorch,│ │
│  │                │ │   fallback       │ │  optional)     │ │
│  │                │ │                  │ │ → geometric    │ │
│  │                │ │                  │ │   fallback     │ │
│  └────────────────┘ └──────────────────┘ └────────────────┘ │
│      Each heavy model is gated by a memory check (psutil)    │
│      before TensorFlow/PyTorch is even imported — on a       │
│      low-RAM host, analysis transparently runs on the CV/    │
│      geometric fallback path instead of risking an OOM crash.│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA STORAGE                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  MongoDB   │  │  Model     │  │  Static    │            │
│  │ (users,    │  │  Weights   │  │  Uploads   │            │
│  │  analyses) │  │ (.h5/.pth) │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v18 or higher) — https://nodejs.org/
2. **Python** (3.10 or higher) — https://www.python.org/
3. **MongoDB** — a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
4. **Git**

#### Optional but Recommended

- **VS Code** with React/Python extensions
- **Postman** or the built-in FastAPI Swagger UI (`/docs`) for testing API endpoints

---

### Installation

#### Step 1: Clone the Repository

```bash
git clone https://github.com/jasminedorathy/AI-Beauty-Consultant.git
cd AI-Beauty-Consultant
```

#### Step 2: Backend Setup

```bash
cd Backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

> The trained skin model (`app/models/densenet_skin_best.h5`, TensorFlow) and face-shape model (`app/models/face_shape_efficientnetv2s.pth`, PyTorch) are loaded **lazily and only if the host has enough RAM** (see [Machine Learning Models](#machine-learning-models)). `tensorflow` and `torch` are not pinned in `requirements.txt` by default — install them separately if you want the trained-model paths active locally:
> ```bash
> pip install tensorflow torch torchvision
> ```
> Without them, analysis still works end-to-end using the OpenCV/geometric fallback paths.

#### Step 3: Frontend Setup

```bash
cd Frontend
npm install
```

#### Step 4: Environment Configuration

Copy `Backend/.env.example` to `Backend/.env` and fill in your values:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here

JWT_SECRET=REPLACE_WITH_256_BIT_RANDOM_VALUE
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=30

MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=beauty_consultant

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here

GOOGLE_PLACES_API_KEY=your_google_places_api_key

REDIS_URL=redis://localhost:6379/0
REDIS_RATE_LIMIT_ENABLED=false

FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:8000
```

(Optional) create `Frontend/.env` if you need to override the API URL the frontend points to — check `Frontend/src/services/api.js` for the exact variable name used.

---

### Running the Application

#### Step 1: Start the Backend Server

```bash
cd Backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

python run.py
```

This starts Uvicorn on `http://localhost:8000` (with `reload=True` for development). Interactive API docs are available at `http://localhost:8000/docs`.

#### Step 2: Start the Frontend Development Server

```bash
cd Frontend
npm start
```

This runs the Vite dev server, typically at `http://localhost:3000`.

#### Step 3: Use the Application

1. Open `http://localhost:3000` in your browser
2. Sign up / log in
3. Go to **Analyze** and upload a photo, or try the demo mode
4. Explore the dashboard, hair/nail styling, salon booking, and AI consultant chat

---

## 📁 Project Structure

```
AI-Beauty-Consultant/
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Shared UI components (Loader, ErrorMessage, etc.)
│   │   ├── features/
│   │   │   ├── analysis/      # AnalyzePage.js, ResultCard.js
│   │   │   ├── chat/          # AI consultant chat
│   │   │   ├── history/
│   │   │   ├── services/
│   │   │   └── styling/       # Hair & nail styling
│   │   ├── layout/             # DashboardLayout.js, Sidebar.js, Navbar.js
│   │   ├── pages/
│   │   ├── auth/
│   │   ├── context/            # AuthContext.js
│   │   ├── services/           # api.js (Axios client)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── Backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app instance, CORS, router registration
│   │   ├── api/                # All route modules (analysis, auth, admin, salon,
│   │   │                       #   payments, loyalty, gamification, etc.)
│   │   ├── auth/                # JWT, RBAC, 2FA logic
│   │   ├── core/                # model_memory_guard.py and other shared utilities
│   │   ├── ml/                  # analysis_cv.py, face_shape_predictor.py,
│   │   │                       #   skin_model_loader.py, color_analysis.py, etc.
│   │   ├── mongodb/              # DB connection/collections
│   │   ├── models/               # Pydantic schemas
│   │   ├── pipeline/
│   │   ├── recommender/
│   │   └── utils/
│   │
│   ├── models/                  # Model weight files (e.g. face_shape_efficientnetv2s.pth)
│   ├── app/models/               # densenet_skin_best.h5 (skin model weights)
│   ├── data/skin_dataset/        # Training images (train/val, acne/normal/oily)
│   ├── static/                   # Uploaded/annotated images served to the frontend
│   ├── run.py                    # Uvicorn entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── DATASET_GUIDE.md          # Skin-model training dataset guide
│
├── README.md                     # This file
└── DATASET_GUIDE.md              # Top-level copy of the dataset guide
```

---

## 🔌 API Documentation

Base URL (local dev): `http://localhost:8000`

Full interactive documentation (auto-generated from the FastAPI route definitions, always in sync with the actual API) is available at:

```
http://localhost:8000/docs       # Swagger UI
http://localhost:8000/redoc      # ReDoc
```

### Key Endpoint: Face Analysis

**POST** `/api/analyze` (multipart/form-data, requires auth)

```http
POST /api/analyze
Content-Type: multipart/form-data

image: <file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "face_shape": "Oval",
    "confidence": 0.91,
    "gender": "Female",
    "skin_analysis": { "acne": 0.12, "...": "..." },
    "color_analysis": { "skin_tone": "...", "...": "..." },
    "recommendations": ["..."],
    "personalized_tips": ["..."],
    "image_url": "/static/uploads/...",
    "annotated_image_url": "/static/uploads/...",
    "faces_detected_count": 1,
    "multiple_faces_detected": false,
    "face_quality": { "warning": null },
    "face_shape_model_status": "LOADED"
  }
}
```

`face_shape_model_status` (and the equivalent for the skin model, exposed via `/api/admin/model-status`) tells you whether the trained model actually ran (`LOADED`) or the app fell back to the geometric/heuristic path (`SKIPPED_LOW_MEMORY`, `TORCH_NOT_AVAILABLE` / `TENSORFLOW_NOT_AVAILABLE`, `WEIGHTS_FILE_MISSING`, `LOAD_ERROR`). The frontend surfaces this as the "Method" badge on the result card.

For the full list of endpoints (auth, admin, salons, appointments, payments, loyalty, gamification, chat, etc.), see `/docs` or browse `Backend/app/api/`.

---

## 🤖 Machine Learning Models

This project uses trained deep-learning models **where available**, with automatic, transparent fallback to classical computer-vision / geometric heuristics when a trained model can't be loaded — by design, so the app keeps working reliably on small hosting tiers (e.g. Render's free plan, ~512MB–1GB RAM) instead of crashing.

#### 1. **Face Detection & Landmarking**
- **Method**: MediaPipe Face Mesh (468-point landmarks)
- **Purpose**: Locate face(s), extract landmarks for geometric measurements, and check image quality (blur, lighting, framing)

#### 2. **Skin Classifier**
- **Architecture**: DenseNet-201 (Keras/TensorFlow), trained on 3 classes: `acne`, `normal`, `oily`
- **Weights**: `Backend/app/models/densenet_skin_best.h5`
- **Loading**: lazy — TensorFlow is only imported, and the model only loaded, if a memory check passes (`min_gb=1.5` by default, tunable via `SKIN_MODEL_MIN_RAM_GB`)
- **Fallback**: pure OpenCV heuristics (K-means clustering, brightness/entropy statistics) if the model can't load for any reason
- **Honesty note**: the trained model only classifies acne/normal/oily. Other concerns surfaced in the UI (dark spots, fine lines, wrinkles, redness, sensitivity) are heuristic estimates, not CNN classifications — there is currently no labeled training data for those classes (see [Dataset Guide](#machine-learning-models)).

#### 3. **Face-Shape Classifier**
- **Architecture**: EfficientNetV2-S (PyTorch)
- **Weights**: `Backend/models/face_shape_efficientnetv2s.pth`
- **Classes**: Diamond, Heart, Long, Oval, Pear, Round, Square, Triangle
- **Loading**: lazy — torch/torchvision are only imported, and the model only loaded, if a memory check passes (`min_gb=1.0` by default, tunable via `FACE_SHAPE_MODEL_MIN_RAM_GB`)
- **Fallback**: geometric face-shape classification from MediaPipe landmark ratios if the model can't load for any reason

#### Checking which path is actually active

Call `GET /api/admin/model-status` (admin role required) or check the `face_shape_model_status` field on any `/api/analyze` response. Possible statuses: `LOADED`, `SKIPPED_LOW_MEMORY`, `TORCH_NOT_AVAILABLE` / `TENSORFLOW_NOT_AVAILABLE`, `WEIGHTS_FILE_MISSING`, `LOAD_ERROR`, `NOT_LOADED` (not yet resolved).

### Training the Models

See [`DATASET_GUIDE.md`](./DATASET_GUIDE.md) for the skin-model dataset layout, sources, and the `train_densenet.py` training command.

---

## ⚙️ Configuration

### Frontend Configuration

**`Frontend/tailwind.config.js`** — theme customization (colors, animations).

Vite-based env vars (if used) go in `Frontend/.env`; check `Frontend/src/services/api.js` for the exact variable name your build expects.

### Backend Configuration

All backend configuration is via environment variables (`Backend/.env`, see `.env.example`) — JWT secrets/expiry, MongoDB connection, Razorpay keys, SMTP, Google Places, Redis, and frontend/base URLs. There is no separate `config.py` `Config` class; FastAPI app setup (CORS origins, etc.) lives in `Backend/app/main.py`.

Memory thresholds for the optional ML models can be tuned without a code change via `SKIN_MODEL_MIN_RAM_GB` and `FACE_SHAPE_MODEL_MIN_RAM_GB`.

---

## 🐛 Troubleshooting

### Frontend Issues

**Issue**: `npm install` fails
```bash
npm cache clean --force
npm install
# or
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Port 3000 already in use — Vite will usually pick the next free port automatically; check the terminal output for the actual URL.

### Backend Issues

**Issue**: `ModuleNotFoundError` for a package in `requirements.txt`
```bash
# Ensure the virtual environment is activated, then:
pip install -r requirements.txt
```

**Issue**: Skin/face-shape model not loading (`face_shape_model_status` is not `"LOADED"`)
- Check `GET /api/admin/model-status` for the exact reason (`TORCH_NOT_AVAILABLE`, `SKIPPED_LOW_MEMORY`, `WEIGHTS_FILE_MISSING`, etc.)
- If it's `TORCH_NOT_AVAILABLE` / `TENSORFLOW_NOT_AVAILABLE`: install `torch`/`tensorflow` locally (see [Installation](#installation))
- If it's `SKIPPED_LOW_MEMORY`: either run on a host with more RAM, or lower the threshold via `SKIN_MODEL_MIN_RAM_GB` / `FACE_SHAPE_MODEL_MIN_RAM_GB` (only do this if you've confirmed the host can actually handle the memory cost — the whole point of the guard is to avoid an OOM crash)
- This is expected, by-design behavior on low-memory hosting, not a bug — the app is meant to keep working via the CV/geometric fallback either way

**Issue**: CORS errors — check `ALLOWED_ORIGINS` in `Backend/app/main.py` and `FRONTEND_URL` in `.env`

**Issue**: MongoDB connection errors — verify `MONGODB_URL`/`MONGODB_DB_NAME` in `.env` and that MongoDB is reachable from where the backend is running

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Coding Standards

- **Frontend**: Follow React best practices and ESLint rules
- **Backend**: Follow PEP 8 Python style guide
- **Backward compatibility**: Prefer additive, optional changes over breaking existing API response shapes or component props
- **Commits**: Use conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

**Jasmine Dorathy**
- GitHub: [@jasminedorathy](https://github.com/jasminedorathy)
- Project Link: [AI-Beauty-Consultant](https://github.com/jasminedorathy/AI-Beauty-Consultant)

---

## 🙏 Acknowledgments

- PyTorch and TensorFlow teams for the ML frameworks
- MediaPipe team for face landmark detection
- React and FastAPI communities
- All contributors and testers

---

**Made with ❤️ by Jasmine Dorathy**

**⭐ Star this repo if you find it helpful!**
