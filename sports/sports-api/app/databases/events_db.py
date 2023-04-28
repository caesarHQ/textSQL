from sqlalchemy import text

from app.config import EVENTS_ENGINE


def row2dict(row):
    return {key: value for key, value in row.items()}


def add_example_with_sql(query, sql):
    if not EVENTS_ENGINE:
        return False
    # insert it into the engine
    props = {
        "sql_text": query,
        "query_text": sql,
        "app": "nbai"
    }
    with EVENTS_ENGINE.connect() as conn:
        # get the ID back and convert it to a str
        query = text(
            """
            INSERT INTO example_queries (query_text, sql_text)
            VALUES (:query_text, :sql_text)
            RETURNING id
            """)
        result = conn.execute(query, props)
        event_id = result.fetchone()[0]
        event_id = str(event_id)
    return event_id


def get_event_by_id(event_id):
    params = {
        "event_id": event_id
    }
    query = text(
        """
        SELECT *
        from events
        WHERE event_id = :event_id
        """)
    with EVENTS_ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )
        result = con.execute(query, params)
        rows = result.fetchall()
    events = []
    for row in rows:
        row_as_dict = row._mapping
        events.append(row2dict(row_as_dict))
    try:
        return events[0]
    except:
        return {}
