import os
from datetime import datetime
from flask import current_app

def log_unlock(sam: str, success: bool):

    try:
        log_path = current_app.config["LOG_PATH"]
        os.makedirs(os.path.dirname(log_path), exist_ok=True)

        status = "SUCCESS" if success else "FAIL"

        line = f"{datetime.now()} | UNLOCK | sam={sam} | {status}\n"

        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line)

    except Exception:
        pass