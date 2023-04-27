import json


def stream_sql_response(request_body):
    yield '{"result": "success", "sql_query": "SELECT * FROM table"}'

    print('doing stuff')

    yield '{"result": "success", "sql_query": "SELECT * FROM table"}'
