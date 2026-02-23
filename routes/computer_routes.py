from flask import Blueprint, render_template, request, session
from services.ad_computer_service import search_ad_computers, open_remote

computer_bp = Blueprint("computer_bp", __name__)

@computer_bp.route("/computer", methods=["GET", "POST"])
def computer_page():

    computers = []

    if request.method == "POST":
        keyword = request.form.get("keyword", "").strip()
        session["computer_keyword"] = keyword

    keyword = session.get("computer_keyword")

    if keyword:
        computers = search_ad_computers(keyword)

    return render_template(
        "index.html",
        tab="computer",
        users=[],
        computers=computers,
        keyword=keyword
    )


@computer_bp.route("/remote/<hostname>")
def remote_pc(hostname):
    open_remote(hostname)
    return "", 204