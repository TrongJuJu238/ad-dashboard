import json
import os
from backend.config import Config

CALENDAR_DATA_FILE = os.path.join(Config.BASE_DIR, "data", "calendar_data.json")

def get_calendar_data():
    if not os.path.exists(CALENDAR_DATA_FILE):
        return {}
    with open(CALENDAR_DATA_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return {}

def save_calendar_data(data):
    with open(CALENDAR_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
def get_user_events(staff="PHAN HUU TRONG"):
    data = get_calendar_data()
    return data.get(staff, {})

def save_user_event(date, shift, staff="PHAN HUU TRONG"):
    data = get_calendar_data()
    if staff not in data:
        data[staff] = {}
    data[staff][date] = shift
    save_calendar_data(data)
    return True
