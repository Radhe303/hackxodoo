import os

from supabase import create_client, Client
from dotenv import load_dotenv


load_dotenv()


# =========================================================
# REQUIRED ENVIRONMENT VARIABLES
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured")

if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_KEY is not configured")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured")


# =========================================================
# APPLICATION CONFIGURATION
# =========================================================

class Config:

    JWT_SECRET_KEY = JWT_SECRET_KEY

    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:3000"
    )

    COOKIE_SECURE = os.getenv(
        "COOKIE_SECURE",
        "False"
    ).lower() == "true"


# =========================================================
# SUPABASE CLIENT
# =========================================================

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)