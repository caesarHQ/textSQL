import json
import time

from ..table_selection.utils import get_relevant_tables_from_lm


def stream_sql_response(request_body):

    natural_language_query = request_body.get("natural_language_query")
    table_names = request_body.get("table_names")

    yield json.dumps({"result": "success", "state": "Processing Tables"}, separators=(",", ":")) + '\n'

    try:
        table_names = get_relevant_tables_from_lm(
            natural_language_query, ignore_comments=True)
    except Exception as e:
        yield json.dumps({"result": "error", "error": str(e), 'step': 'tables'}, separators=(",", ":")) + '\n'
        return None

    yield json.dumps({"result": "success", "state": "Tables Acquired", "tables": table_names, "step": "tables"}, separators=(",", ":")) + '\n'

    print('doing stuff')

    yield json.dumps({"result": "success", "sql_query": "SELECT * FROM table\nwheee"}, separators=(",", ":")) + '\n'

    print('done doing stuff')

    return None
