from flask import Blueprint, render_template, request, jsonify
import json
import os
from datetime import datetime

calendar_bp = Blueprint("calendar_bp", __name__)
CALENDAR_DATA_FILE = "calendar_data.json"

def get_calendar_data():
    if not os.path.exists(CALENDAR_DATA_FILE):
        return {}
    with open(CALENDAR_DATA_FILE, "r") as f:
        return json.load(f)

def save_calendar_data(data):
    with open(CALENDAR_DATA_FILE, "w") as f:
        json.dump(data, f)

@calendar_bp.route("/calendar")
def calendar_page():
   # Tạm mock data cho test
    roster = {
        "schedule": {}
    }

    return render_template(
        "index.html",
        tab="calendar",
        roster=roster
    )
@calendar_bp.route("/api/calendar/save", methods=["POST"])
def save_event():
    data = request.json
    date = data.get("date")
    shift = data.get("shift")
    staff = data.get("staff", "PHAN HUU TRONG")
    
    calendar_data = get_calendar_data()
    if staff not in calendar_data:
        calendar_data[staff] = {}
    
    calendar_data[staff][date] = shift
    save_calendar_data(calendar_data)
    return jsonify({"success": True})

@calendar_bp.route("/api/calendar/load")
def load_events():
    staff = request.args.get("staff", "PHAN HUU TRONG")
    calendar_data = get_calendar_data()
    return jsonify(calendar_data.get(staff, {}))
