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
def create_session(app_name):
    parms = {
        "app_name": app_name,
        "user_id": None,
    }
    create_query = text("""
        INSERT INTO sessions (app_name)
        VALUES (:app_name)
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
def register_thread(thread_id, session_id, service_name):
    params = {
        "thread_id": thread_id,
        "session_id": session_id,
        "service_name": service_name,
    }
    create_query = text("""
        INSERT INTO threads (thread_id, session_id, service_name)
        VALUES (:thread_id, :session_id, :service_name)
    """)
    with EVENTS_ENGINE.connect() as conn:
        conn.execute(create_query, params)
        conn.commit()


@failsoft
def get_session_id_from_thread_id(thread_id):
    params = {
        "thread_id": thread_id,
    }
    select_query = text("""
        select session_id
        from threads
        where thread_id = :thread_id
    """)
    with EVENTS_ENGINE.connect() as conn:
        result = conn.execute(select_query, params)
        conn.commit()
        row = result.fetchone()
        session_id = row[0]

    return str(session_id)


@failsoft
def log_input(app, query_text, session_id=None):
    params = {
        "app": app,
        "query_text": query_text,
        "session_id": session_id,
    }

    insert_query = text("""
        INSERT INTO queries (app, query_text, session_id)
        VALUES (:app, :query_text, :session_id)
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
def update_input(id: str, rows_returned: int, sql_text: str, session_id=None):

    if not id:
        return None

    if session_id:
        params = {
            "id": id,
            "rows_returned": rows_returned,
            "sql_text": sql_text,
            "session_id": session_id,
        }

        update_query = text("""
            UPDATE queries
            SET rows_returned = :rows_returned, sql_text = :sql_text, session_id = :session_id
            WHERE id = :id
            """)

    else:
        params = {
            "id": id,
            "rows_returned": rows_returned,
            "sql_text": sql_text,
        }

        update_query = text("""
            UPDATE queries
            SET rows_returned = :rows_returned, sql_text = :sql_text
            WHERE id = :id
            """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(update_query, params)
        conn.commit()

    return {"status": "success"}


def check_cached_exists(some_text):
    params = {
        "input_text": some_text,
    }

    select_query = text("""
        select query_text, sql_text
        from queries
        where query_text = :input_text
        and sql_text is not null
        and approved_at is not null
        and unapproved_at is null
        limit 1
    """)

    with EVENTS_ENGINE.connect() as conn:
        result = conn.execute(select_query, params)
        conn.commit()
        row = result.fetchone()
        if row:
            # get the sql_text
            return row[1]
        else:
            return False


@failsoft
def log_sql_failure(input_text, sql_script, failure_message, attempt_number):
    if not EVENTS_ENGINE:
        return {"status": "no engine"}

    params = {
        "input_text": input_text,
        "sql_script": sql_script,
        "failure_message": failure_message,
        "attempt_number": attempt_number,
        "app_name": 'nbai',
    }

    insert_query = text("""
        INSERT INTO sql_failures (input_text, sql_script, failure_message, attempt_number, app_name)
        VALUES (:input_text, :sql_script, :failure_message, :attempt_number, :app_name)
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(insert_query, params)
        conn.commit()

    return {"status": "success"}
