from flask import Blueprint, render_template, request, redirect, url_for
from services.task_service import get_all_tasks, add_task
from datetime import datetime
import calendar
task_bp = Blueprint("task_bp", __name__)

@task_bp.route("/task", methods=["GET", "POST"])
def task_page():

    if request.method == "POST":
        pass

    # Lấy tháng/năm từ query param
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)

    now = datetime.now()

    # Nếu chưa có param → dùng tháng hiện tại
    if not year:
        year = now.year
    if not month:
        month = now.month

    # Thông tin tháng
    first_weekday, days_in_month = calendar.monthrange(year, month)

    # Previous month
    prev_month = month - 1
    prev_year = year
    if prev_month == 0:
        prev_month = 12
        prev_year -= 1

    # Next month
    next_month = month + 1
    next_year = year
    if next_month == 13:
        next_month = 1
        next_year += 1

    tasks = get_all_tasks()

    stats = {
        "active": len([t for t in tasks if t['status'] != 'Done']),
        "completed": len([t for t in tasks if t['status'] == 'Done']),
        "in_progress": len([t for t in tasks if t['status'] == 'In Progress']),
        "todo": len([t for t in tasks if t['status'] == 'Todo'])
    }

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