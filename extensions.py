from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS


# =========================================================
# RATE LIMITER
# =========================================================

limiter = Limiter(
    key_func=get_remote_address
)


# =========================================================
# CORS
# =========================================================

cors = CORS