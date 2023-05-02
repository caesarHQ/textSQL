from app.utils import get_openai_results

from app.chat import conversational_chat_response
from app.chat import conversational_lookup_response


def classify_input_purpose(input):

    classification_message = f"""You are an expert chatbot. Your goal is to classify the user intent in order to answer their question appropriately.
You have access to the following databases:
  - NBA Games
  - NBA Players
  - NBA Teams
  - NBA Stats

Given a chat history, determine whether the user is asking to do another database query or if the user is asking questions that can be answered without a database query.

Provide a response from this list: ["REQUIRES QUERY", "DOES NOT REQUIRE QUERY"]

Message History: {input}

Provide your classification:"""

    messages = [{
        "role": "user", "content": classification_message},
    ]

    res = get_openai_results(
        messages, n=1, temperature=0)[0]

    return res


def route_session_response(new_input, session_id):

    input_purpose = classify_input_purpose(new_input)

    print('input_purpose: ', input_purpose)

    if input_purpose == 'REQUIRES QUERY':
        return conversational_lookup_response.handle_lookup_response(new_input, session_id)

    return conversational_chat_response.handle_chat_response(new_input, session_id)
