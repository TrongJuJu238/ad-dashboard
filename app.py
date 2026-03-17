from flask import Flask
from config import Config
from routes.user_routes import user_bp
from routes.computer_routes import computer_bp
from routes.task_routes import task_bp
from routes.calendar_routes import calendar_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = app.config["SECRET_KEY"]

    app.register_blueprint(user_bp)
    app.register_blueprint(computer_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(calendar_bp)
    return app

app = create_app()
@app.route("/user-groups/<username>")
def user_groups(username):

    user = conn.search(
        "dc=htpvtg,dc=local",
        f"(sAMAccountName={username})",
        attributes=["memberOf"]
    )

    groups = []

    if conn.entries:
        for g in conn.entries[0].memberOf:
            groups.append(str(g).split(",")[0].replace("CN=",""))

    return jsonify({"groups": groups})
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=app.config["DEBUG"]
    )
#from waitress import serve

#if __name__ == "__main__":
#    serve(app, host="0.0.0.0", port=5000)