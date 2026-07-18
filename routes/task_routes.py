from flask import Blueprint, render_template, request, redirect, url_for
from services.task_service import get_all_tasks, add_task
from datetime import datetime
import calendar
task_bp = Blueprint("task_bp", __name__)

@task_bp.route("/task", methods=["GET", "POST"])
def task_page():

    if request.method == "POST":
        data = request.form

        new_task = {
            "task": data.get("description", "New Call"),
            "eid": data.get("eid"),
            "name": data.get("name"),
            "dept": data.get("dept"),
            "ext": data.get("ext"),
            "note": data.get("note"),
            "priority": data.get("priority", "Medium"),
            "due_date": data.get("due_date"),
            "status": data.get("status", "Todo")
        }

        add_task(new_task)
        return redirect(url_for("task_bp.task_page"))

    # ===== GET LOGIC =====

    tasks = get_all_tasks()

    stats = {
        "active": len([t for t in tasks if t['status'] != 'Done']),
        "completed": len([t for t in tasks if t['status'] == 'Done']),
        "in_progress": len([t for t in tasks if t['status'] == 'In Progress']),
        "todo": len([t for t in tasks if t['status'] == 'Todo'])
    }

    now = datetime.now()

    year = request.args.get("year", type=int) or now.year
    month = request.args.get("month", type=int) or now.month

    first_weekday, days_in_month = calendar.monthrange(year, month)

    # Previous
    prev_month = month - 1 or 12
    prev_year = year - 1 if month == 1 else year

    # Next
    next_month = month + 1 if month < 12 else 1
    next_year = year + 1 if month == 12 else year

    return render_template(
        "index.html",
        tab="task",
        today=now.day if (year == now.year and month == now.month) else None,
        days_in_month=days_in_month,
        first_weekday=first_weekday,
        current_month=datetime(year, month, 1).strftime("%B %Y"),
        year=year,
        month=month,
        prev_month=prev_month,
        prev_year=prev_year,
        next_month=next_month,
        next_year=next_year,
        tasks=tasks,
        stats=stats
    )