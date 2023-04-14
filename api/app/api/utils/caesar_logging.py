import json
from sqlalchemy import text

from app.config import EVENTS_ENGINE

def log_apicall(duration, provider, model, input_tokens, output_tokens, service, purpose):
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
        "success": "true"
    }

    insert_query = text("""
        INSERT INTO apicalls (duration, provider, model, input_tokens, output_tokens, service, purpose, cost, success)
        VALUES (:duration, :provider, :model, :input_tokens, :output_tokens, :service, :purpose, :cost, :success)
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(insert_query, params)
        conn.commit()
    
    return {"status": "success"}

def log_apicall_failure(duration, provider, model, input_tokens, service, purpose):
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
        "success": "false"
    }

    insert_query = text("""
        INSERT INTO apicalls (duration, provider, model, input_tokens, output_tokens, service, purpose, cost, success)
        VALUES (:duration, :provider, :model, :input_tokens, :output_tokens, :service, :purpose, :cost, :success)
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


def log_input_classification(app_name, input_text, metadata):
    if not EVENTS_ENGINE:
        return None

    params = {
        "app_name": app_name,
        "input_text": input_text,
        "metadata": json.dumps(metadata),
    }

    insert_query = text("""
        INSERT INTO input_classifications (app_name, input_text, metadata)
        VALUES (:app_name, :input_text, :metadata)
        returning id
    """)

    with EVENTS_ENGINE.connect() as conn:
        # get the ID back
        result = conn.execute(insert_query, params)
        conn.commit()
        row = result.fetchone()
        generation_id = row[0]
    
    return str(generation_id)

def log_sql_failure(input_text, sql_script, failure_message, attempt_number, app_name):
    if not EVENTS_ENGINE:
        return {"status": "no engine"}

    params = {
        "input_text": input_text,
        "sql_script": sql_script,
        "failure_message": failure_message,
        "attempt_number": attempt_number,
        "app_name": app_name,
    }

    insert_query = text("""
        INSERT INTO sql_failures (input_text, sql_script, failure_message, attempt_number, app_name)
        VALUES (:input_text, :sql_script, :failure_message, :attempt_number, :app_name)
    """)

    with EVENTS_ENGINE.connect() as conn:
        conn.execute(insert_query, params)
        conn.commit()
    
    return {"status": "success"}
