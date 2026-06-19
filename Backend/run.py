import uvicorn
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── Fix Windows Unicode/Emoji print errors (cp1252 → utf-8) ──────────────────
os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Fix OpenBLAS Memory Allocation Error
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

