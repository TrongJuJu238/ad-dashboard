import json
import os
from backend.config import Config

TASKS_FILE = os.path.join(Config.BASE_DIR, "data", "tasks.json")

def get_all_tasks():
    if not os.path.exists(TASKS_FILE):
        return []
    with open(TASKS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return []

def add_task(task_data):
    tasks = get_all_tasks()
    task_data['id'] = max([t.get('id', 0) for t in tasks], default=0) + 1
    tasks.insert(0, task_data)
    with open(TASKS_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=4)
    return True
