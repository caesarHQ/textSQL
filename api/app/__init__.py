from flask import Flask, jsonify, make_response
from flask_admin import Admin
from flask_cors import CORS
from flask_migrate import Migrate

from app.api.routes import bp as api_bp
from app.config import FlaskAppConfig
from app.extensions import db


def create_app(config_object=FlaskAppConfig):
    app = Flask(__name__)
    app.config.from_object(config_object)
    CORS(app)

    # Initialize app with extensions
    db.init_app(app)
    # migrate = Migrate(app, db)
    with app.app_context():
        db.create_all()
    admin = Admin(None, name='admin', template_mode='bootstrap3')
    admin.init_app(app)

    @app.route("/ping")
    def ping():
        return 'pong'


    app.register_blueprint(api_bp, url_prefix='/api')

    # from app.errors import bp as errors_bp
    # app.register_blueprint(errors_bp)

    # from app.main import bp as main_bp
    # app.register_blueprint(main_bp)

    return app