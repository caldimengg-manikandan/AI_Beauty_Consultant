"""
heuristic_thresholds.py — Single source of truth documenting the magic
numbers used throughout the computer-vision/heuristic analysis pipeline.

WHY THIS FILE EXISTS
---------------------
Most of the scoring in this project is not a single trained model -- it's a
hybrid of CNN predictions plus a large number of hand-tuned thresholds
(brightness cutoffs, ratio cutoffs, blend weights, etc.) spread across
app/ml/analysis_cv.py, app/ml/color_analysis.py, and app/pipeline/preprocess.py.
Those thresholds were calibrated empirically and are easy to lose track of.
This module exists purely as documentation/reference so future changes are
deliberate instead of accidental.

IMPORTANT — NO BEHAVIOR CHANGE:
  The constants below are a curated reference copy with the SAME values
  already hard-coded at each call site. Changing a value here does NOT
  automatically change app behavior unless the corresponding call site is
  also updated to import from here. app/pipeline/preprocess.py has been
  wired up to import its thresholds from this module (see PREPROCESS_*
  below) as a demonstration of the pattern; app/ml/analysis_cv.py and
  app/ml/color_analysis.py still use their own inline literals (left
  untouched to avoid any risk of altering established, tuned behavior) --
  the values below mirror them 1:1 for reference, with comments pointing at
  the function where each one currently lives.

If you intend to retune any of these for accuracy work, change it in BOTH
places (the call site and this file) and run scripts/validate_accuracy.py
before/after to confirm direction and magnitude of the change.
"""

# ---------------------------------------------------------------------------
# app/pipeline/preprocess.py — ImageQualityValidator.validate()
# These ARE imported and used live by preprocess.py (see that file).
# ---------------------------------------------------------------------------
PREPROCESS_MIN_RESOLUTION_PX = 200          # reject if width or height < this
PREPROCESS_MIN_BRIGHTNESS = 40              # reject if mean grayscale brightness below this (too dark)
PREPROCESS_MAX_BRIGHTNESS = 230             # reject if mean grayscale brightness above this (overexposed)
PREPROCESS_MIN_BLUR_VARIANCE = 45           # Laplacian variance; reject if below this (too blurry)

# ---------------------------------------------------------------------------
# app/pipeline/preprocess.py — ImageQualityValidator.validate_face_geometry()
# These ARE imported and used live by preprocess.py (see that file).
# ---------------------------------------------------------------------------
FACE_GEOMETRY_MIN_AREA_RATIO = 0.04         # face bbox area / image area; below this -> "move closer" warning
FACE_GEOMETRY_MAX_POSE_ASYMMETRY = 0.35     # nose-to-cheek distance asymmetry; above this -> "face turned" warning

# ---------------------------------------------------------------------------
# app/ml/analysis_cv.py — calculate_face_shape()
# Reference only (not yet imported there) -- mirrors the literals in that file.
# ---------------------------------------------------------------------------
FACE_SHAPE_CNN_HIGH_CONFIDENCE = 0.85       # CNN result trusted outright above this
FACE_SHAPE_CNN_MODERATE_CONFIDENCE = 0.6    # CNN preferred over geometry above this when they disagree
FACE_SHAPE_AGREEMENT_CONFIDENCE_BOOST = 0.1 # added to CNN confidence when CNN and geometry agree (capped at 0.98)
FACE_SHAPE_AGREEMENT_CONFIDENCE_CAP = 0.98
FACE_SHAPE_DISAGREEMENT_CNN_DISCOUNT = 0.9  # CNN confidence multiplier when trusted despite disagreement

# ---------------------------------------------------------------------------
# app/ml/analysis_cv.py — get_gender_net() / classify_gender_geometric()
# Reference only -- mirrors the literals in that file.
# ---------------------------------------------------------------------------
GENDER_CNN_ULTRA_CONFIDENCE = 0.98          # CNN result returned immediately above this
GENDER_CNN_FUSION_WEIGHT = 3.5              # multiplier applied to CNN probability before fusing with biometric votes
GENDER_ROUND_FACE_MALE_CORRECTION_PROB = 0.65   # for Round/Oval faces with close scores, nudge toward Male above this
GENDER_ROUND_FACE_MALE_CORRECTION_BONUS = 1.0

# ---------------------------------------------------------------------------
# app/ml/analysis_cv.py — _gender_fallback_analysis() (biometric voting)
# Reference only -- mirrors the literals in that file.
# ---------------------------------------------------------------------------
GENDER_FWHR_MALE_THRESHOLD = 1.95
GENDER_FWHR_FEMALE_THRESHOLD = 1.78
GENDER_BROW_DIST_FEMALE_THRESHOLD = 16.5
GENDER_BROW_DIST_MALE_THRESHOLD = 8.5
GENDER_JAW_RATIO_MALE_THRESHOLD = 0.91
GENDER_JAW_RATIO_FEMALE_THRESHOLD = 0.82
GENDER_MOUTH_RATIO_MALE_THRESHOLD = 1.85
GENDER_MOUTH_RATIO_FEMALE_THRESHOLD = 1.6
GENDER_STUBBLE_VARIANCE_RATIO_STRONG = 2.8
GENDER_STUBBLE_VARIANCE_RATIO_WEAK = 1.8
GENDER_HAIR_TOP_STD_THRESHOLD = 48
GENDER_BASELINE_FEMALE_BIAS = 1.0           # salon-context prior; see comment in _gender_fallback_analysis

# ---------------------------------------------------------------------------
# app/ml/analysis_cv.py — analyze_skin_cv()
# Reference only -- mirrors the literals in that file.
# ---------------------------------------------------------------------------
SKIN_KMEANS_BASELINE_REDNESS = 0.1          # baseline blush ignored before scaling acne ratio
SKIN_KMEANS_ACNE_SCALE = 2.5
SKIN_KMEANS_ACNE_CAP = 0.95
SKIN_HYBRID_CNN_HIGH_ACNE = 0.6             # above this, CNN gets 70% weight vs K-means 30%
SKIN_HYBRID_CNN_WEIGHT_HIGH = 0.7
SKIN_HYBRID_CNN_WEIGHT_LOW = 0.3
SKIN_OIL_RATIO_SCALE = 2.5
SKIN_TEXTURE_ENTROPY_OFFSET = 5.5
SKIN_TEXTURE_ENTROPY_SCALE = 2.0

# ---------------------------------------------------------------------------
# app/ml/analysis_cv.py — detect_hair_properties()
# Reference only -- mirrors the literals in that file.
# ---------------------------------------------------------------------------
HAIR_RECESSION_RATIO_BASELINE = 0.30
HAIR_RECESSION_SCORE_SCALE = 500
HAIR_RECESSION_OPTIMAL_MAX = 25
HAIR_RECESSION_HIGH_FOREHEAD_MAX = 50
HAIR_RECESSION_EARLY_MAX = 75
HAIR_DENSITY_THICK_THRESHOLD = 0.18
HAIR_DENSITY_NORMAL_THRESHOLD = 0.08
HAIR_CURL_COILY_THRESHOLD = 52
HAIR_CURL_CURLY_THRESHOLD = 38
HAIR_CURL_WAVY_THRESHOLD = 22

# ---------------------------------------------------------------------------
# app/ml/color_analysis.py — brightness-based skin/eye/hair classification
# Reference only -- mirrors the literals in that file.
# ---------------------------------------------------------------------------
COLOR_SKIN_BRIGHTNESS_DEEP_MAX = 100
COLOR_SKIN_BRIGHTNESS_TAN_MAX = 140
COLOR_SKIN_BRIGHTNESS_MEDIUM_MAX = 180
COLOR_SKIN_BRIGHTNESS_LIGHT_MAX = 210
