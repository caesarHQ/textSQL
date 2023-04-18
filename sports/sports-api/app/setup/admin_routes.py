from flask import Blueprint, jsonify, make_response, request

from . import admin_helper
from ..utils import get_assistant_message

admin_bp = Blueprint('admin_bp', __name__)

# note, make the wrapper for localhost around admin, not around the functions but for now this is fine


@admin_bp.route('/db_auth', methods=['GET'])
def get_db_auth():
    """
    Get database credentials from storage
    """
    return make_response(jsonify(admin_helper.get_db_credentials()), 200)


@admin_bp.route('/db_auth', methods=['POST'])
def set_db_auth():
    """
    Set database credentials in storage
    """
    try:
        request_body = request.get_json()
    except Exception as e:
        return make_response(jsonify({"error": 'Unable to parse form'}), 400)
    # try to connect to database
    try:
        admin_helper.set_db_credentials(request_body)
    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 400)

    return make_response(jsonify({"status": "success", "message": "database connection established"}), 200)


@admin_bp.route('/openai_auth', methods=['GET'])
def get_openai_auth():
    """
    Get openai credentials from storage
    """
    return make_response(jsonify(admin_helper.get_openai_credentials()), 200)


@admin_bp.route('/openai_auth', methods=['POST'])
def set_openai_auth():
    """
    Set openai credentials in storage
    """
    try:
        request_body = request.get_json()
    except Exception as e:
        return make_response(jsonify({"error": 'Unable to parse form'}), 400)
    # try to connect to database
    try:
        admin_helper.set_openai_credentials(request_body)
    except Exception as e:
        return make_response(jsonify({"error": str(e)}), 400)

    return make_response(jsonify({"status": "success", "message": "openai key loaded"}), 200)


@admin_bp.route('/tables', methods=['GET'])
def get_tables():
    """
    Get the list of tables we're able to use
    """
    return make_response(jsonify(admin_helper.get_tables()), 200)


@admin_bp.route('/tables', methods=['POST'])
def save_tables():
    new_data = request.get_json()
    new_tables = new_data.get('tables')
    return make_response(jsonify(admin_helper.save_tables(new_tables)), 200)


@admin_bp.route('/generate_schema', methods=['POST'])
def generate_schema():
    # given a table schema and a (later) head, make a query to create the table.
    table_data = request.get_json()
    print('table_data', table_data)

    system_message = {
        "role": "system",
        "content": """You are an expert programmer. Your goal is to create SQL code. You provide only the SQL asked for.
These should look like:
CREATE TABLE best_trucks (-- wow this table is cool
    col1 int, -- contains the number sold in 2022
    col2 varchar(255) -- the name of the truck in model|vendor|year format
);
or 
CREATE TABLE cats  -- this table holds all my cats
(  
    cat_id int, -- this is the id of the cat formatted owner|ssn
    cat_name varchar(255) -- this is the name of the cat in wingdings
);
""",
    }

    table_name = table_data.get("name")
    table_columms = table_data.get("columns")
    table_head = table_data.get("head")

    formatted_schema = []
    for col in table_columms:
        formatted_schema.append(f"{col['name']} {col['type']}")

    formatted_schema = ", \n".join(formatted_schema)

    formatted_head = ""
    for row in table_head:
        formatted_head += ", ".join([str(col) for col in row]) + "\n"

    table_str = f"""Table Name:
    {table_name}
    
    Table Schema:
    {formatted_schema}

    Table Head:
    {formatted_head}
  """

    user_string = f"""Please create the CREATE TABLE sql query for the information in this table:
    {table_str}
    
    For formatting the SQL, please:
        - include inline SQL comments (--) on each line based on the schema
        - it should start with CREATE TABLE
            - add a comment after the ( on the same line using -- for a brief description of the table content/purpose
        - then each for each column
            - the name
            - the type
            - a comment with the purpose/info on the data

    Return the SQL and only the SQL. Make the best attempt you can with the information present."""

    user_message = {
        "role": "user",
        "content": user_string,
    }

    res = get_assistant_message([system_message, user_message])
    print('res', res)
    res = res["message"]["content"]

    return jsonify({"status": 'success', "message": res})


@admin_bp.route('/load_enums', methods=['GET'])
def load_enums():
    print('GETING ENUMS')
    res = admin_helper.load_enums()

    return jsonify(res)
