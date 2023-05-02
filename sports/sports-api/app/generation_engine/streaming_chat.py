from app.databases import logging_db
from app.utils import get_openai_results


def handle_response(new_input, session_id):
    yield {"status": "working", "state": "Building History", "step": "chat"}
    prior_responses = logging_db.get_inputs_by_session_id(session_id)
    history = []

    for resp in prior_responses:
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

    message_prefix = "You are a helpful basketball fan continuing the conversation above. You already went into the database and retried some results for the user. Now you are answering followup questions. Provide the best answer you can.\n\n"
    history.append({'role': 'user', 'content': message_prefix + new_input})

    ai_response = get_openai_results(history, n=1, temperature=.4)[0]

    logging_db.log_chat_response('nbai', query_text, ai_response, session_id)

    yield {"status": "complete", "state": ai_response}

    return
