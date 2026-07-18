import os
import json

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
SETTINGS_FILE = os.path.join(BASE_DIR, "data", "settings.json")

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {}

_settings = load_settings()

class Config:
    SECRET_KEY = "ad-dashboard-session-key"
    DEBUG = True
    AD_DOMAIN = _settings.get('AD_DOMAIN', "htpvtg.local")
    LDAP_SERVER = _settings.get('LDAP_SERVER', "htpvtg.local")
    POWERSHELL_TIMEOUT = _settings.get('POWERSHELL_TIMEOUT', 25)
    DAMEWARE_PATH = _settings.get('DAMEWARE_PATH', r"C:\Program Files (x86)\SolarWinds\DameWare Remote Support\DWRCC.exe")
    BASE_DIR = BASE_DIR
    LOG_PATH = os.path.join(BASE_DIR, "logs", "audit.log")

def save_settings(new_settings):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(new_settings, f, indent=4)
