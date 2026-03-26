# AI Beauty Consultant 💄✨

> An intelligent, AI-powered beauty analysis platform that provides personalized skincare recommendations, face shape analysis, and styling suggestions using advanced machine learning and computer vision.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)
![Flask](https://img.shields.io/badge/flask-2.0+-000000.svg)

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
- [Frontend Components](#frontend-components)
- [Machine Learning Models](#machine-learning-models)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About the Project

**AI Beauty Consultant** is a comprehensive beauty analysis platform that leverages artificial intelligence and computer vision to provide personalized beauty recommendations. The application analyzes facial features, skin conditions, and provides tailored suggestions for skincare routines, hairstyles, and makeup.

### Key Objectives

- **Personalized Analysis**: Provide accurate, AI-driven skin and facial analysis
- **User-Friendly Interface**: Modern, intuitive UI with smooth animations and professional design
- **Real-Time Processing**: Instant analysis using webcam or uploaded images
- **Comprehensive Recommendations**: Detailed suggestions for skincare, hair, and makeup
- **Educational**: Help users understand their skin type and beauty needs

### Target Users

- Beauty enthusiasts seeking personalized recommendations
- Individuals wanting to understand their skin type and concerns
- People looking for hairstyle and makeup suggestions
- Beauty professionals for client consultations

---

## ✨ Features

### 🔍 Core Features

#### 1. **Face Analysis**
- Upload photos for instant AI-powered skin analysis
- Detects skin type (oily, dry, combination, normal)
- Identifies skin concerns (acne, dark spots, fine lines, wrinkles)
- Analyzes face shape (oval, round, square, heart, diamond)
- Provides confidence scores for each detection

#### 2. **Live Camera Analysis**
- Real-time face analysis using webcam
- Instant feedback on skin conditions
- Live face shape detection
- Interactive visual overlays

#### 3. **Skin Health Dashboard**
- Track hydration levels over time
- Monitor sun protection habits
- Analyze skin texture improvements
- Visual progress indicators with charts

#### 4. **Personalized Recommendations**
- Custom skincare routine suggestions
- Product recommendations based on skin type
- Dietary and lifestyle tips
- SPF and sun protection guidance

#### 5. **Hair Styling Suggestions**
- Hairstyle recommendations based on face shape
- Color suggestions based on skin tone
- Style gallery with examples
- Virtual try-on capabilities

#### 6. **Nail Art Studio**
- Curated nail designs based on skin tone
- Occasion-based recommendations
- Nail shape suggestions
- Color palette matching

#### 7. **Analysis History**
- Track all previous analyses
- Compare results over time
- Export analysis reports
- View improvement trends

### 🎨 UI/UX Features

- **Modern Design**: Purple & Teal color scheme with glassmorphism effects
- **Smooth Animations**: Staggered fade-ins, hover effects, and transitions
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Eye-friendly interface for all lighting conditions
- **Accessibility**: WCAG compliant with keyboard navigation

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework for building interactive components |
| **React Router** | 6.0+ | Client-side routing and navigation |
| **Tailwind CSS** | 3.0+ | Utility-first CSS framework for styling |
| **React Icons** | 4.0+ | Icon library for UI elements |
| **Axios** | 1.0+ | HTTP client for API requests |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Core programming language |
| **Flask** | 2.0+ | Web framework for REST API |
| **TensorFlow** | 2.0+ | Deep learning framework for ML models |
| **OpenCV** | 4.0+ | Computer vision library for image processing |
| **NumPy** | 1.20+ | Numerical computing library |
| **Pillow** | 8.0+ | Image processing library |
| **scikit-learn** | 1.0+ | Machine learning utilities |

### Development Tools

- **Git** - Version control
- **npm** - Package manager for frontend
- **pip** - Package manager for backend
- **VS Code** - Recommended IDE

---

## 🏗️ Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│                     (React Frontend)                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Dashboard  │  │  Analysis  │  │  History   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      REST API LAYER                          │
│                     (Flask Backend)                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Routes   │  │Middleware  │  │   Auth     │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ML/CV PROCESSING LAYER                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │Face Detect │  │Skin Analyze│  │ Feature    │            │
│  │   (CV)     │  │   (ML)     │  │ Extract    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA STORAGE                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Models    │  │  Datasets  │  │   Cache    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

#### Required Software

1. **Node.js** (v14.0 or higher)
   - Download: https://nodejs.org/
   - Verify installation: `node --version`

2. **Python** (v3.8 or higher)
   - Download: https://www.python.org/
   - Verify installation: `python --version`

3. **Git**
   - Download: https://git-scm.com/
   - Verify installation: `git --version`

4. **pip** (Python package manager)
   - Usually comes with Python
   - Verify installation: `pip --version`

#### Optional but Recommended

- **VS Code** - Code editor with extensions for React and Python
- **Postman** - For testing API endpoints
- **Chrome DevTools** - For frontend debugging

---

### Installation

Follow these step-by-step instructions to set up the project on your local machine.

#### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/jasminedorathy/AI-Beauty-Consultant.git

# Navigate to project directory
cd AI-Beauty-Consultant
```

#### Step 2: Frontend Setup

##### Option A: Automated Setup (Recommended)

**Windows:**
```bash
# Simply double-click the setup file or run:
setup_frontend.bat
```

**Mac/Linux:**
```bash
# Make the script executable
chmod +x setup_frontend.sh

# Run the setup script
./setup_frontend.sh
```

##### Option B: Manual Setup

```bash
# Navigate to frontend directory
cd Frontend/frontend

# Install all dependencies (this may take 2-3 minutes)
npm install

# Verify installation
npm list --depth=0
```

**Expected Output:**
```
├── react@18.2.0
├── react-dom@18.2.0
├── react-router-dom@6.x.x
├── tailwindcss@3.x.x
└── ... (other dependencies)
```

#### Step 3: Backend Setup

##### Option A: Automated Setup (Recommended)

**Windows:**
```bash
# Simply double-click the setup file or run:
setup_backend.bat
```

**Mac/Linux:**
```bash
# Make the script executable
chmod +x setup_backend.sh

# Run the setup script
./setup_backend.sh
```

##### Option B: Manual Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install all dependencies (this may take 3-5 minutes)
pip install -r requirements.txt

# Verify installation
pip list
```

**Expected Output:**
```
Flask==2.x.x
tensorflow==2.x.x
opencv-python==4.x.x
numpy==1.x.x
... (other packages)
```

#### Step 4: Environment Configuration

##### Frontend Environment Variables

Create a `.env` file in `Frontend/frontend/`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_TIMEOUT=30000

# Feature Flags
REACT_APP_ENABLE_LIVE_CAMERA=true
REACT_APP_ENABLE_HISTORY=true

# Analytics (optional)
REACT_APP_GA_TRACKING_ID=your-tracking-id
```

##### Backend Environment Variables

Create a `.env` file in `Backend/`:

```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=True

# Server Configuration
HOST=0.0.0.0
PORT=5000

# Model Paths
MODEL_PATH=models/
DATASET_PATH=datasets/

# Security
SECRET_KEY=your-secret-key-here
MAX_CONTENT_LENGTH=16777216  # 16MB max file size

# CORS
CORS_ORIGINS=http://localhost:3000
```

#### Step 5: Verify Installation

```bash
# Check if all files are present
ls -la

# You should see:
# - Frontend/
# - Backend/
# - README.md
# - setup_frontend.bat/sh
# - setup_backend.bat/sh
# - .gitignore
```

---

### Running the Application

#### Step 1: Start the Backend Server

```bash
# Navigate to backend directory
cd Backend

# Activate virtual environment (if not already activated)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Start Flask server
python app.py
```

**Expected Output:**
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

**Backend will be available at:** `http://localhost:5000`

#### Step 2: Start the Frontend Development Server

Open a **new terminal window** (keep backend running):

```bash
# Navigate to frontend directory
cd Frontend/frontend

# Start React development server
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Frontend will automatically open at:** `http://localhost:3000`

#### Step 3: Access the Application

1. **Open your browser** and navigate to `http://localhost:3000`
2. **You should see** the AI Beauty Consultant landing page
3. **Click "Get Started"** to access the dashboard
4. **Try the features:**
   - Upload a photo for analysis
   - Use live camera for real-time analysis
   - Explore hair and nail styling suggestions

---

## 📁 Project Structure

```
AI-Beauty-Consultant/
│
├── Frontend/                          # React frontend application
│   └── frontend/
│       ├── public/                    # Static files
│       │   ├── index.html            # HTML template
│       │   ├── favicon.ico           # App icon
│       │   └── manifest.json         # PWA manifest
│       │
│       ├── src/                       # Source code
│       │   ├── components/           # Reusable UI components
│       │   │   ├── Button.js
│       │   │   ├── Card.js
│       │   │   └── Modal.js
│       │   │
│       │   ├── features/             # Feature modules
│       │   │   ├── analysis/         # Face analysis feature
│       │   │   │   ├── AnalyzePage.js
│       │   │   │   ├── ResultCard.js
│       │   │   │   └── UploadZone.js
│       │   │   │
│       │   │   ├── chat/             # AI consultant chat
│       │   │   │   └── ConsultantChat.js
│       │   │   │
│       │   │   ├── history/          # Analysis history
│       │   │   │   └── HistoryPage.js
│       │   │   │
│       │   │   ├── services/         # Services page
│       │   │   │   └── ServicesPage.js
│       │   │   │
│       │   │   └── styling/          # Hair & nail styling
│       │   │       ├── HairStyling.js
│       │   │       └── NailStyling.js
│       │   │
│       │   ├── layout/               # Layout components
│       │   │   ├── DashboardLayout.js
│       │   │   ├── Sidebar.js
│       │   │   └── Navbar.js
│       │   │
│       │   ├── pages/                # Page components
│       │   │   ├── LandingPage.js    # Home page
│       │   │   ├── DashboardHome.js  # Dashboard
│       │   │   └── NotFound.js       # 404 page
│       │   │
│       │   ├── auth/                 # Authentication
│       │   │   ├── Login.js
│       │   │   └── Signup.js
│       │   │
│       │   ├── App.js                # Main app component
│       │   ├── index.js              # Entry point
│       │   └── index.css             # Global styles
│       │
│       ├── package.json              # Dependencies
│       ├── tailwind.config.js        # Tailwind configuration
│       └── postcss.config.js         # PostCSS configuration
│
├── Backend/                           # Flask backend application
│   ├── app/                          # Application package
│   │   ├── __init__.py              # App initialization
│   │   ├── main.py                  # Main Flask app
│   │   │
│   │   ├── api/                     # API routes
│   │   │   ├── __init__.py
│   │   │   ├── routes.py            # API endpoints
│   │   │   └── analysis.py          # Analysis endpoints
│   │   │
│   │   ├── models/                  # ML models (not in repo)
│   │   │   ├── face_detector.h5
│   │   │   ├── skin_classifier.pkl
│   │   │   └── shape_detector.pth
│   │   │
│   │   └── utils/                   # Utility functions
│   │       ├── image_processing.py
│   │       ├── face_detection.py
│   │       └── skin_analysis.py
│   │
│   ├── datasets/                     # Training datasets (not in repo)
│   ├── static/                       # Static files
│   │   └── uploads/                 # Uploaded images
│   │
│   ├── app.py                       # Flask entry point
│   ├── requirements.txt             # Python dependencies
│   ├── config.py                    # Configuration
│   │
│   ├── train_densenet.py            # Model training script
│   ├── collect_kaggle.py            # Dataset collection
│   ├── collect_stock.py             # Stock image collection
│   ├── auto_create_dataset.py       # Dataset automation
│   │
│   └── Documentation/               # Backend documentation
│       ├── SIMPLE_METHOD.md         # Simple dataset guide
│       ├── COLLECTION_GUIDE.md      # Comprehensive guide
│       ├── QUICK_START.md           # Quick start guide
│       └── DATASET_GUIDE.md         # Dataset documentation
│
├── .gitignore                        # Git ignore rules
├── README.md                         # This file
├── setup_frontend.bat               # Windows frontend setup
├── setup_backend.bat                # Windows backend setup
├── setup_frontend.sh                # Mac/Linux frontend setup
└── setup_backend.sh                 # Mac/Linux backend setup
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Face Analysis

**POST** `/api/analyze`

Analyzes an uploaded image for skin type, concerns, and face shape.

**Request:**
```http
POST /api/analyze
Content-Type: multipart/form-data

{
  "image": <file>,
  "options": {
    "detectSkinType": true,
    "detectConcerns": true,
    "detectFaceShape": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "skinType": "combination",
    "confidence": 0.89,
    "concerns": [
      {
        "type": "dark_spots",
        "severity": "moderate",
        "confidence": 0.76
      },
      {
        "type": "fine_lines",
        "severity": "mild",
        "confidence": 0.82
      }
    ],
    "faceShape": "oval",
    "recommendations": [
      "Use vitamin C serum for dark spots",
      "Apply retinol at night for fine lines",
      "Moisturize twice daily"
    ]
  },
  "timestamp": "2026-01-27T15:30:00Z"
}
```

#### 2. Live Camera Analysis

**POST** `/api/analyze/live`

Analyzes a frame from live camera feed.

**Request:**
```http
POST /api/analyze/live
Content-Type: application/json

{
  "frame": "<base64_encoded_image>",
  "timestamp": "2026-01-27T15:30:00Z"
}
```

#### 3. Get Analysis History

**GET** `/api/history`

Retrieves user's analysis history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "date": "2026-01-27",
      "skinType": "combination",
      "concerns": ["dark_spots", "fine_lines"],
      "imageUrl": "/uploads/abc123.jpg"
    }
  ],
  "total": 15
}
```

#### 4. Get Recommendations

**POST** `/api/recommendations`

Gets personalized recommendations based on analysis.

**Request:**
```json
{
  "skinType": "combination",
  "concerns": ["dark_spots", "fine_lines"],
  "age": 28,
  "gender": "female"
}
```

---

## 🎨 Frontend Components

### Key Components

#### 1. **DashboardHome**
- Main dashboard with skin health overview
- Quick action cards for features
- Recent analyses timeline
- Personalized tips section

#### 2. **AnalyzePage**
- Image upload zone with drag-and-drop
- Live camera integration
- Real-time analysis results
- Annotated image display

#### 3. **Sidebar**
- Animated navigation menu
- Staggered fade-in effects
- Active route highlighting
- User profile section

#### 4. **ResultCard**
- Analysis results display
- Confidence scores
- Visual indicators
- Recommendation cards

### Styling System

**Color Palette:**
```css
/* Primary Colors */
--purple-500: #a855f7;
--purple-600: #9333ea;
--teal-500: #14b8a6;
--teal-600: #0d9488;

/* Gradients */
--gradient-primary: linear-gradient(135deg, #a855f7 0%, #14b8a6 100%);
--gradient-background: linear-gradient(135deg, #f3e7ff 0%, #e0f2f1 100%);
```

**Animations:**
- Fade-in-up: Entry animations for content
- Bounce-subtle: Hover effects on interactive elements
- Pulse-glow: Attention-grabbing elements
- Blob: Background decorative animations

---

## 🤖 Machine Learning Models

### Models Used

#### 1. **Face Detection Model**
- **Architecture**: Haar Cascade / MTCNN
- **Purpose**: Detect faces in images
- **Accuracy**: ~95%
- **Input**: RGB image
- **Output**: Bounding box coordinates

#### 2. **Skin Type Classifier**
- **Architecture**: DenseNet121
- **Purpose**: Classify skin type (oily, dry, combination, normal)
- **Accuracy**: ~89%
- **Input**: Cropped face image (224x224)
- **Output**: Skin type + confidence score

#### 3. **Skin Concern Detector**
- **Architecture**: Multi-label CNN
- **Purpose**: Detect multiple skin concerns
- **Concerns Detected**: Acne, dark spots, fine lines, wrinkles, redness
- **Input**: Face image
- **Output**: List of concerns with severity levels

#### 4. **Face Shape Classifier**
- **Architecture**: ResNet50
- **Purpose**: Classify face shape
- **Shapes**: Oval, round, square, heart, diamond
- **Accuracy**: ~82%

### Training the Models

See `Backend/COLLECTION_GUIDE.md` for detailed instructions on:
- Collecting training datasets
- Preparing data
- Training models
- Evaluating performance
- Deploying models

---

## ⚙️ Configuration

### Frontend Configuration

**`tailwind.config.js`** - Customize theme:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#a855f7',
        secondary: '#14b8a6',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
      },
    },
  },
}
```

### Backend Configuration

**`config.py`** - Server settings:
```python
class Config:
    DEBUG = True
    TESTING = False
    SECRET_KEY = 'your-secret-key'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = 'static/uploads'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Frontend Issues

**Issue**: `npm install` fails
```bash
# Solution 1: Clear npm cache
npm cache clean --force
npm install

# Solution 2: Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Port 3000 already in use
```bash
# Solution: Use a different port
PORT=3001 npm start
```

#### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'flask'`
```bash
# Solution: Ensure virtual environment is activated
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Then reinstall
pip install -r requirements.txt
```

**Issue**: Model files not found
```bash
# Solution: Download or train models
# See Backend/COLLECTION_GUIDE.md for instructions
```

**Issue**: CORS errors
```bash
# Solution: Check CORS configuration in Backend/app.py
# Ensure frontend URL is in allowed origins
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Coding Standards

- **Frontend**: Follow React best practices and ESLint rules
- **Backend**: Follow PEP 8 Python style guide
- **Commits**: Use conventional commit messages
- **Documentation**: Update README for new features

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

- TensorFlow team for the ML framework
- React team for the frontend framework
- OpenCV community for computer vision tools
- Tailwind CSS for the styling system
- All contributors and testers

---

## 📞 Support

If you encounter any issues or have questions:

1. **Check the documentation** in `Backend/` directory
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Contact**: Open an issue on GitHub

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] User authentication and profiles
- [ ] Social sharing of analyses
- [ ] Product recommendations with affiliate links
- [ ] Mobile app (React Native)
- [ ] Advanced skin concern detection
- [ ] Virtual makeup try-on
- [ ] Integration with beauty brands
- [ ] Multi-language support

---

**Made with ❤️ by Jasmine Dorathy**

**⭐ Star this repo if you find it helpful!**
