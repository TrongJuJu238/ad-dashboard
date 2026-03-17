from flask import Blueprint, render_template, request, session,jsonify
from services.ad_user_service import search_ad_users
import subprocess
import json
user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/", methods=["GET", "POST"])
def index():

    users = []

    if request.method == "POST":
        keyword = request.form.get("keyword", "").strip()
        session["last_keyword"] = keyword

    keyword = session.get("last_keyword")

    if keyword:
        users = search_ad_users(keyword)

    return render_template(
        "index.html",
        tab="user",
        users=users,
        computers=[],
        keyword=keyword
    )
def get_user_groups(username):

    username = username.replace('"', '')

    ps_command = f'''
    Get-ADUser "{username}" -Properties MemberOf |
    Select -ExpandProperty MemberOf |
    ForEach-Object {{ ($_ -split ",")[0] -replace "CN=","" }} |
    ConvertTo-Json
    '''

    result = subprocess.run(
        ["powershell", "-Command", ps_command],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("POWERSHELL ERROR:")
        print(result.stderr)
        return []

    output = result.stdout.strip()

    if not output:
        return []

    try:
        data = json.loads(output)

        if isinstance(data, str):
            return [data]

        return data

    except Exception as e:
        print("JSON PARSE ERROR:", e)
        return []

@user_bp.route("/user-groups/<username>")
def user_groups(username):

    groups = get_user_groups(username)

    return jsonify({
        "groups": groups if groups else []
    })

@user_bp.route("/compare-groups/<user1>/<user2>")
def compare_groups(user1, user2):

    groups1 = get_user_groups(user1)
    groups2 = get_user_groups(user2)

    all_groups = set(groups1) | set(groups2)

    result = []

    for g in sorted(all_groups):
        result.append({
            "group": g,
            "user1": g in groups1,
            "user2": g in groups2
        })

    return jsonify(result)