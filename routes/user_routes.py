from flask import Blueprint, render_template, request, session
from services.ad_user_service import search_ad_users

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