import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify, session, make_response
from backend.services.auth_service import authenticate
from backend.services.ad_user_service import search_ad_users, unlock_user, get_user_groups, compare_groups
from backend.services.ad_computer_service import search_ad_computers, open_remote
from backend.config import Config

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.before_request
def handle_preflight():
    if request.method == 'OPTIONS':
        return make_response(), 200

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid payload"})
        
    username = data.get('username')
    password = data.get('password')
    
    result = authenticate(username, password)
    if result:
        session['user'] = result
        return jsonify({"success": True, "user": result})
    return jsonify({"success": False, "error": "Authentication failed"})

@app.route('/api/auth/whoami', methods=['GET'])
def whoami():
    return jsonify({"username": os.environ.get('USERNAME', '')})

@app.route('/api/users/search', methods=['POST'])
def api_users_search():
    keyword = request.json.get('keyword', '').strip() if request.json else ''
    users = search_ad_users(keyword)
    return jsonify({"success": True, "data": users})

@app.route('/api/users/unlock', methods=['POST'])
def api_users_unlock():
    sam = request.json.get('sam') if request.json else None
    if not sam: return jsonify({"success": False, "error": "Missing SAM Account"})
    success = unlock_user(sam)
    return jsonify({"success": success})

@app.route('/api/users/groups/<username>', methods=['GET'])
def api_users_groups(username):
    groups = get_user_groups(username)
    return jsonify({"success": True, "groups": groups})

@app.route('/api/users/compare/<user1>/<user2>', methods=['GET'])
def api_users_compare(user1, user2):
    result = compare_groups(user1, user2)
    return jsonify({"success": True, "data": result})

@app.route('/api/computers/search', methods=['POST'])
def api_computers_search():
    keyword = request.json.get('keyword', '').strip() if request.json else ''
    computers = search_ad_computers(keyword)
    return jsonify({"success": True, "data": computers})

@app.route('/api/computers/remote', methods=['POST'])
def api_computers_remote():
    host = request.json.get('host') if request.json else None
    if not host: return jsonify({"success": False, "error": "Missing host"})
    open_remote(host)
    return jsonify({"success": True})

from backend.services.task_service import get_all_tasks, add_task
from backend.services.calendar_service import get_user_events, save_user_event

@app.route('/api/tasks', methods=['GET'])
def api_tasks_get():
    return jsonify({"success": True, "data": get_all_tasks()})

@app.route('/api/tasks', methods=['POST'])
def api_tasks_add():
    task_data = request.json
    success = add_task(task_data)
    return jsonify({"success": success})

@app.route('/api/calendar/save', methods=['POST'])
def api_calendar_save():
    data = request.json
    date = data.get("date")
    shift = data.get("shift")
    staff = data.get("staff", "PHAN HUU TRONG")
    success = save_user_event(date, shift, staff)
    return jsonify({"success": success})

@app.route('/api/calendar/load', methods=['GET'])
def api_calendar_load():
    staff = request.args.get("staff", "PHAN HUU TRONG")
    data = get_user_events(staff)
    return jsonify({"success": True, "data": data})

from backend.config import save_settings

@app.route('/api/logs', methods=['GET'])
def api_logs():
    if not os.path.exists(Config.LOG_PATH):
        return jsonify({"success": True, "data": "No logs found."})
    try:
        with open(Config.LOG_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()
            return jsonify({"success": True, "data": "".join(lines[-100:])})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/settings', methods=['GET'])
def api_settings_get():
    return jsonify({
        "success": True,
        "data": {
            "AD_DOMAIN": Config.AD_DOMAIN,
            "LDAP_SERVER": Config.LDAP_SERVER,
            "DAMEWARE_PATH": Config.DAMEWARE_PATH,
            "POWERSHELL_TIMEOUT": Config.POWERSHELL_TIMEOUT
        }
    })

@app.route('/api/settings', methods=['POST'])
def api_settings_save():
    data = request.json
    save_settings(data)
    Config.AD_DOMAIN = data.get('AD_DOMAIN', Config.AD_DOMAIN)
    Config.LDAP_SERVER = data.get('LDAP_SERVER', Config.LDAP_SERVER)
    Config.DAMEWARE_PATH = data.get('DAMEWARE_PATH', Config.DAMEWARE_PATH)
    Config.POWERSHELL_TIMEOUT = data.get('POWERSHELL_TIMEOUT', Config.POWERSHELL_TIMEOUT)
    return jsonify({"success": True})

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5050))
    app.run(port=port, host='127.0.0.1')
