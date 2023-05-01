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
