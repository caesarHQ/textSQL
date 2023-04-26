import json
from os import getenv
from dotenv import load_dotenv
from sqlalchemy import create_engine
import requests
from sqlalchemy import text

load_dotenv()

EVENTS_URL = getenv("EVENTS_URL")

endpoint = 'https://text-sql-be2.onrender.com' 

def queryTextToTables(payload):
    headers = {'Content-Type': 'application/json'}
    res = requests.post(endpoint + '/api/get_tables', json=payload, headers=headers)
    return res.json()

def queryTextToSQL(payload):
    headers = {'Content-Type': 'application/json'}
    res = requests.post(endpoint + '/api/text_to_sql', json=payload, headers=headers)
    return res.json()

scope = ['SF']

good = []
bad = []
attempted = []
results = []

# go thru and test that each of the generate tables -> generate SQL works
def testQueryWorks(query, scope):
    global good, bad, attempted, results
    print('trying ', query)
    attempted.append(query)
    try:
        payload = {
        "natural_language_query": query,
        "scope": scope
        }
        res = queryTextToTables(payload)
        print('tables: ', res['table_names'])
        payload = {
            "table_names": res['table_names'],
            "natural_language_query": query,
            "scope": scope
        }
        res2 = queryTextToSQL(payload)
        print(len(res2['result']['column_names']), ' columns')
        print(len(res2['result']['results']), 'rows')
        print('SQL query: \n', res2['sql_query'])
        print('\n \n---- \n \n')
        good.append(query)
        results.append({'q': query, 
                        'columns': len(res2['result']['column_names']), 
                        'rows': len(res2['result']['results']),
                        'sql': res2['sql_query']
        })
        
    
    except Exception as e:
        print('Failure!', str(e))
        bad.append({'q': query, 'e':str(e)})

# test the SF homepage queries
if 'SF' in scope:
    queries = [
    'plz Show me all the needles in SF',
    'plz Show me all the muggings',
    'plz Which two neighborhoods have the most homeless activity?',
    'plz Which five neighborhoods have the most poop on the street?',
    'plz Which four neighborhoods had the most crime incidents involving guns or knives in 2021?',
    'plz 3 neighborhoods with the highest female to male ratio',
    'plz What are the top 5 neighborhoods with the most encampments per capita?',
    'plz What hours of the day do most burglaries occur?',
    ]
    for q in queries:
        testQueryWorks(q, "SF")

print('good: ', len(good))
print('bad: ', len(bad))
print('attempted: ', len(attempted))
print('results: ', results)

EVENTS_ENGINE = create_engine(EVENTS_URL)

params = {
    'app_name': 'sf_prod',
    'passed': len(good),
    'failed': len(bad),
    'attempted': len(attempted),
    'percent_passing': 0 if len(attempted) == 0 else len(good)/len(attempted),
    'result_stats': json.dumps(results)
}

insert_query = text("""
    INSERT INTO health_checks (app_name, passed, failed, attempted, percent_passing, result_stats)
    VALUES (:app_name, :passed, :failed, :attempted, :percent_passing, :result_stats)""")

with EVENTS_ENGINE.connect() as conn:
    conn.execute(insert_query, params)
    conn.commit()