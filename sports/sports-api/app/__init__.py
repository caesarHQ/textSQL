from app.config import FlaskAppConfig, DB_MANAGED_METADATA
from app.extensions import db
# import models to create tables if they don't exist
from app.models import in_context_examples, table_metadata, type_metadata
from app.setup.routes import bp as setup_bp
from app.sql_explanation.routes import bp as sql_explanation_bp
from app.sql_generation.routes import bp as sql_gen_bp
from app.table_selection.routes import bp as table_selection_bp
from app.visualization.routes import bp as visualization_bp
from app.table_selection.utils import load_tables_and_types_metadata
from app.utils import load_in_context_examples
from flask import Flask
from flask_admin import Admin
from flask_cors import CORS
from flask_migrate import Migrate


def create_app(config_object=FlaskAppConfig):
    app = Flask(__name__)
    app.config.from_object(config_object)
    CORS(app)


    # Initialize app with extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    with app.app_context():
        if DB_MANAGED_METADATA:
            db.create_all()
        load_tables_and_types_metadata()
        load_in_context_examples()
    admin = Admin(None, name='admin', template_mode='bootstrap3')
    admin.init_app(app)


    @app.route("/ping")
    def ping():
        return 'pong'

    app.register_blueprint(setup_bp)
    app.register_blueprint(sql_explanation_bp)
    app.register_blueprint(sql_gen_bp)
    app.register_blueprint(table_selection_bp)
    app.register_blueprint(visualization_bp)

    # from app.errors import bp as errors_bp
    # app.register_blueprint(errors_bp)

    # from app.main import bp as main_bp
    # app.register_blueprint(main_bp)

    @app.teardown_request
    def session_clear(exception=None):
        db.session.remove()
        if exception:
            if db.session.is_active:
                db.session.rollback()

    return app