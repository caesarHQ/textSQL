def handle_response(new_input, session_id):
    print('yielding first response')
    yield {"status": "working", "state": "Acquiring Tables", "step": "tables"}

    print('yielding second response')
    return {"status": "complete", "message": "Thanks for chatting with me!"}
