import os
from datetime import datetime
from backend.config import Config

def log_unlock(sam: str, success: bool):

    try:
        log_path = Config.LOG_PATH
        os.makedirs(os.path.dirname(log_path), exist_ok=True)

        status = "SUCCESS" if success else "FAIL"

        line = f"{datetime.now()} | UNLOCK | sam={sam} | {status}\n"

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line)

    except Exception:
        pass
