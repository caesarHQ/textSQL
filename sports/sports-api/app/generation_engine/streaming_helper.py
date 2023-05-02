import json

from app.generation_engine.engine import Engine
from app.generation_engine.utils.json_encoder import CustomJSONEncoder


def stream_sql_response(request_body):

    natural_language_query = request_body.get("natural_language_query")
    session_id = request_body.get("session_id")
    thread_id = request_body.get("thread_id")

    engine = Engine()

    engine.set_query(natural_language_query)
    engine.set_session_id(session_id)
    engine.set_thread_id(thread_id)

    for res in engine.run():
        try:
            new_response = json.dumps(res, separators=(
                ",", ":"), cls=CustomJSONEncoder) + '\n'
            yield new_response
            if res['status'] == 'error':
                return None
        except Exception as e:
            print('error: ', e)
            print('res: ', res)
            yield json.dumps({"status": "error", "error": str(e)}) + '\n'
