from app.config import EVENTS_ENGINE
from sqlalchemy import text

"""
CREATE TABLE featured_queries (
   input_text TEXT,
   selected_tables TEXT[],
   generated_sql TEXT,
   first_seen TIMESTAMP WITH TIME ZONE
);
"""

def get_featured_table(input_str):

    print('checking featured tables')

    if not EVENTS_ENGINE:
        return False
    
    params = {
        "input_text": input_str,
    }
    query = text("""
        SELECT * FROM featured_queries
        WHERE input_text = :input_text
    """)
    with EVENTS_ENGINE.connect() as conn:
        result = conn.execute(query, params)
        conn.commit()
        res = result.fetchall()

    print('res: ', res)

    if len(res) == 0:
        return False

    related_tables = res[0][1]

    return related_tables