import json
import os

TASKS_FILE = "tasks.json"

def get_all_tasks():
    if not os.path.exists(TASKS_FILE):
        # Default mock data based on the image provided
        default_tasks = [
            {"id": 1, "task": "Fix authentication bug", "priority": "High", "due_date": "2026-01-05", "status": "In Progress"},
            {"id": 2, "task": "Review pull requests", "priority": "Medium", "due_date": "2026-01-06", "status": "Todo"},
            {"id": 3, "task": "Prepare demo presentation", "priority": "Medium", "due_date": "2026-01-07", "status": "Todo"},
            {"id": 4, "task": "Design new landing page", "priority": "High", "due_date": "2026-01-08", "status": "In Progress"},
            {"id": 5, "task": "Optimize database queries", "priority": "High", "due_date": "2026-01-09", "status": "In Progress"},
            {"id": 6, "task": "Update documentation", "priority": "Low", "due_date": "2026-01-10", "status": "Todo"},
            {"id": 7, "task": "Write unit tests", "priority": "Medium", "due_date": "2026-01-11", "status": "Todo"},
            {"id": 8, "task": "Deploy to production", "priority": "Low", "due_date": "2026-01-12", "status": "Done"},
        ]
        with open(TASKS_FILE, "w") as f:
            json.dump(default_tasks, f)
        return default_tasks
    
    with open(TASKS_FILE, "r") as f:
        return json.load(f)

def add_task(task_data):
    tasks = get_all_tasks()
    task_data['id'] = max([t['id'] for t in tasks], default=0) + 1
    tasks.insert(0, task_data)
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f)
    return True
