import os

class Config:
    SECRET_KEY = "ad-dashboard-session-key"
    DEBUG = True
    AD_DOMAIN = "htpvtg.local"
    POWERSHELL_TIMEOUT = 25
    DAMEWARE_PATH = r"C:\Program Files (x86)\SolarWinds\DameWare Remote Support\DWRCC.exe"
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    LOG_PATH = os.path.join(BASE_DIR, "logs", "audit.log")