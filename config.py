import os

from supabase import create_client, Client
from dotenv import load_dotenv


load_dotenv()


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
if SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split("/rest/v1")[0].rstrip("/")

SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# =========================================================
# REQUIRED CONFIGURATION CHECK
# =========================================================

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY is not configured")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured")


# =========================================================
# APPLICATION CONFIGURATION
# =========================================================

class Config:

    JWT_SECRET_KEY = JWT_SECRET_KEY

    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    )

    COOKIE_SECURE = os.getenv(
        "COOKIE_SECURE",
        "False"
    ).lower() == "true"

    GEMINI_API_KEY = GEMINI_API_KEY


# =========================================================
# SUPABASE CLIENT
# =========================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)