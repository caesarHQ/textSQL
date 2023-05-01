from functools import wraps

from sqlalchemy import text

# for now, i guess will just use the events engine as the logging engine cause why not
from app.config import EVENTS_ENGINE


def failsoft(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not EVENTS_ENGINE:
            return False
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            print('error logging with ', e)
            result = None
        return result
    return wrapper


def log_apicall(duration, provider, model, input_tokens, output_tokens, service, purpose, session_id=None, success=True, log_message=None):
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
    "turbo": {
        "input": .000002,
        "output": .000002,
    },
    "gpt-4": {
        "input": .00003,
        "output": .00006,
    }
}


def calculate_cost(model, input_tokens, output_tokens):
    base_model = 'turbo'
    if model.find('gpt-4') != -1:
        base_model = 'gpt-4'
    cost = costs[base_model]['input'] * input_tokens + \
        costs[base_model]['output'] * output_tokens
    return cost


@failsoft
def create_session(app_name, user_id):
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
def log_input(app, query_text):
    params = {
        "app": app,
        "query_text": query_text,
    }

    insert_query = text("""
        INSERT INTO queries (app, query_text)
        VALUES (:app, :query_text)
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
def update_input(id: str, ran_sql: bool, rows_returned: int, generated_sql: str):

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