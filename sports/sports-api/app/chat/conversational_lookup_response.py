from app.databases import logging_db
from app.generation_engine import streaming_sql_generation_multi


def handle_lookup_response(new_input, session_id):
    yield {"status": "working", "state": "Building History", "step": "chat"}
    prior_responses = logging_db.get_inputs_by_session_id(session_id)
    history = []

    for resp in prior_responses[-8:]:
        user_message = None
        ai_message = None

        query_text = resp['query_text']
        if query_text == 'None':
            query_text = None
        sql_text = resp['sql_text']
        if sql_text == 'None':
            sql_text = None
        output_text = resp['output_text']
        if output_text == 'None':
            output_text = None

        if resp['query_text']:
            user_message = {'role': 'user', 'content': resp['query_text']}
        if resp['sql_text']:
            ai_message = {
                'role': 'assistant', 'content': resp['sql_text'] + '\n' + resp.get('output_head')}
        if resp['output_text']:
            ai_message = {'role': 'assistant', 'content': resp['output_text']}

        if user_message:
            history.append(user_message)
        if ai_message:
            history.append(ai_message)

    current_generation_id = logging_db.log_input('nbai', new_input, session_id)
    for res in streaming_sql_generation_multi.text_to_sql_with_retry_multi(new_input, [], examples=[], session_id=session_id, labels=[], messages=history):

        if res.get('bad_sql'):
            num_rows = None
            logging_db.update_input(
                current_generation_id, num_rows, res['bad_sql'])

        if res.get('sql_query'):
            num_rows = len(
                res.get('response', {}).get('results', []))
            head = {
                'columns: ': res.get('response', {}).get('column_names', []),
                'rows': res.get('response', {}).get('results', [])[:5]
            }

            logging_db.update_input(
                current_generation_id, num_rows, res['sql_query'], session_id=session_id, output_head=head)

        yield {'generation_id': current_generation_id, **res}
