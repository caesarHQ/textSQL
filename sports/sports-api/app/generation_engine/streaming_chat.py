from app.databases import logging_db


def handle_response(new_input, session_id):
    yield {"status": "working", "state": "Building History", "step": "chat"}
    prior_responses = logging_db.get_inputs_by_session_id(session_id)
    print('prior responses', prior_responses)
    history = []

    for resp in prior_responses:
        user_message = None
        ai_message = None
        if resp['query_text']:
            user_message = {'role': 'user', 'content': resp['query_text']}
        if resp['sql_text']:
            ai_message = {'role': 'ai', 'content': resp['sql_text']}
        if resp['output_text']:
            ai_message = {'role': 'ai', 'content': resp['output_text']}

        if user_message:
            history.append(user_message)
        if ai_message:
            history.append(ai_message)

    history.append(
        {'role': 'system', 'content': 'You are a basketball fan. You answer questions about basketball.'})
    history.append({'role': 'user', 'content': new_input})

    return {"status": "complete", "message": "Thanks for chatting with me!"}
