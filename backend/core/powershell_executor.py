import subprocess
from backend.config import Config

def run_powershell(command):

    try:
        result = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
            capture_output=True,
            text=True,
            timeout=Config.POWERSHELL_TIMEOUT
        )

        if result.returncode != 0:
            return None

        if not result.stdout.strip():
            return None

        return result.stdout.strip()

    except subprocess.TimeoutExpired:
        return None
    except Exception:
        return None
