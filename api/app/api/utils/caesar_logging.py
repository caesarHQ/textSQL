from functools import wraps
import json

from sqlalchemy import text

from app.config import EVENTS_ENGINE

def failsoft(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            print('error logging with ', e)
            result = None
        return result
    return wrapper

def log_apicall(duration, provider, model, input_tokens, output_tokens, service, purpose, session_id=None, success=True, log_message=None):
    if not EVENTS_ENGINE:
        return {"status": "no engine"}
    cost = calculate_cost(model, input_tokens, output_tokens)

    params = {
        "duration": duration,
        "provider": provider,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "service": service,
        "purpose": purpose,
        "cost": cost,
        "success": success,
        "session_id": session_id,
        "log_message": log_message,
    }

    insert_query = text("""
        INSERT INTO apicalls (duration, provider, model, input_tokens, output_tokens, service, purpose, cost, success, session_id, log_message)
        VALUES (:duration, :provider, :model, :input_tokens, :output_tokens, :service, :purpose, :cost, :success, :session_id, :log_message)
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(insert_query, params)
        conn.commit()
    
    return {"status": "success"}

@failsoft
def log_apicall_failure(duration, provider, model, input_tokens, service, purpose, session_id=None):
    if not EVENTS_ENGINE:
        return {"status": "no engine"}

    params = {
        "duration": duration,
        "provider": provider,
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": 0,
        "service": service,
        "purpose": purpose,
        "cost": 0,
        "success": "false",
        "session_id": session_id,
    }

    insert_query = text("""
        INSERT INTO apicalls (duration, provider, model, input_tokens, output_tokens, service, purpose, cost, success, session_id)
        VALUES (:duration, :provider, :model, :input_tokens, :output_tokens, :service, :purpose, :cost, :success, :session_id)
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(insert_query, params)
        conn.commit()
    
    return {"status": "success"}



costs = {
    "turbo":{
        "input": .000002,
        "output": .000002,
    },
    "gpt-4":{
        "input": .00003,
        "output": .00006,
    }
}

def calculate_cost(model, input_tokens, output_tokens):
    base_model = 'turbo'
    if model.find('gpt-4') != -1:
        base_model = 'gpt-4'
    cost = costs[base_model]['input'] * input_tokens + costs[base_model]['output'] * output_tokens
    return cost


@failsoft
def log_input_classification(app_name, input_text, metadata, parent_id, session_id=None):
    if not EVENTS_ENGINE:
        return None

    params = {
        "app_name": app_name,
        "input_text": input_text,
        "metadata": json.dumps(metadata),
        "parent_id": parent_id,
        "session_id": session_id
    }

    insert_query = text("""
        INSERT INTO input_classifications (app_name, input_text, metadata, parent_id, session_id)
        VALUES (:app_name, :input_text, :metadata, :parent_id, :session_id)
        returning id
    """)

    with EVENTS_ENGINE.connect() as conn:
        # get the ID back
        result = conn.execute(insert_query, params)
        conn.commit()
        row = result.fetchone()
        generation_id = row[0]
    
    return str(generation_id)

@failsoft
def update_input_classification(id: str, ran_sql: bool, rows_returned: int, generated_sql: str):
    
    if not EVENTS_ENGINE or not id:
        return None

    params = {
        "id": id,
        "ran_sql": ran_sql,
        "rows_returned": rows_returned,
        "generated_sql": generated_sql
    }

    update_query = text("""
        UPDATE input_classifications SET ran_sql = :ran_sql, rows_returned = :rows_returned, generated_sql = :generated_sql
        WHERE id = :id
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(update_query, params)
        conn.commit()
    
    return {"status": "success"}

@failsoft
def log_sql_failure(input_text, sql_script, failure_message, attempt_number, app_name, session_id=None):
    if not EVENTS_ENGINE:
        return {"status": "no engine"}

    params = {
        "input_text": input_text,
        "sql_script": sql_script,
        "failure_message": failure_message,
        "attempt_number": attempt_number,
        "app_name": app_name,
        "session_id": session_id
    }

    insert_query = text("""
        INSERT INTO sql_failures (input_text, sql_script, failure_message, attempt_number, app_name, session_id)
        VALUES (:input_text, :sql_script, :failure_message, :attempt_number, :app_name, :session_id)
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(insert_query, params)
        conn.commit()
    
    return {"status": "success"}

@failsoft
def log_suggested_query(input_text="", reason="", app_name="", parent_id=None, suggested_query="", prompt="", model="", session_id=None):
    if not EVENTS_ENGINE:
        return None

    params = {
        "input_text": input_text,
        "reason": reason,
        "app_name": app_name,
        "parent_id": parent_id,
        "suggested_query": suggested_query,
        "prompt": prompt,
        "model": model,
        "session_id": session_id,
    }

    insert_query = text("""
        INSERT INTO suggested_queries (input_text, reason, app_name, parent_id, suggested_query, prompt, model, session_id)
        VALUES (:input_text, :reason, :app_name, :parent_id, :suggested_query, :prompt, :model, :session_id)
        returning id
    """)
    with EVENTS_ENGINE.connect() as conn:
        # get the ID back
        result = conn.execute(insert_query, params)
        conn.commit()
        row = result.fetchone()
        generation_id = row[0]

    return str(generation_id)

@failsoft
def update_suggestion_as_used(suggestion_id):
    if not EVENTS_ENGINE:
        return None

    params = {
        "suggestion_id": suggestion_id,
    }

    update_query = text("""
        UPDATE suggested_queries
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = :suggestion_id
    """)
    with EVENTS_ENGINE.connect() as conn:
        # get the ID back
        result = conn.execute(update_query, params)
        conn.commit()

    return True

@failsoft
def create_session(app_name, user_id):
    if not EVENTS_ENGINE:
        return None

    parms = {
        "app_name": app_name,
        "user_id": user_id,
    }
    create_query = text("""
        INSERT INTO sessions (app_name, user_id)
        VALUES (:app_name, :user_id)
        returning id
    """)
    with EVENTS_ENGINE.connect() as conn:
        # get the ID back
        result = conn.execute(create_query, parms)
        conn.commit()
        row = result.fetchone()
        session_id = row[0]

    return str(session_id)

@failsoft
def get_feed_data(app):
    if not EVENTS_ENGINE:
        return None

    params = {
        "app": app,
    }

    query = text("""
        select input_text, category, emoji, id
        from featured_queries
        where app = :app
        and featured = true
    """)

    with EVENTS_ENGINE.connect() as conn:
        result = conn.execute(query, params)
        conn.commit()
        rows = result.fetchall()

        rows = [
            {
                "input_text": row[0],
                "category": row[1],
                "emoji": row[2],
                "img": "https://census-gpt-assets.s3.us-west-2.amazonaws.com/" + str(row[3]) + ".png",
            }
            for row in rows
        ]

    return rows
