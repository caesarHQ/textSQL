from app.config import EVENTS_ENGINE
from sqlalchemy import text

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

def get_featured_sql(input_str):
    
        print('checking featured sql')
    
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
    
        related_sql = res[0][2]
    
        return related_sql