import pandas as pd
from app.chat import streaming_chat
from app.config import ENGINE
from app.databases import logging_db
from app.generation_engine import streaming_sql_generation_multi
from app.generation_engine.example_picker import similar_examples_from_pinecone
from app.generation_engine.streaming_sql_generation import \
    text_to_sql_with_retry
from app.generation_engine.streaming_table_selection import get_tables
from app.generation_engine.utils import cleaner
from app.utils import dtype_to_pytype
from sqlalchemy import text

with ENGINE.connect() as conn:
    conn = conn.execution_options(postgresql_readonly=True)
    with conn.begin():
        query = conn.execute(text(f'''
            SELECT * FROM nba_game;
        '''))
    games_df = pd.DataFrame(query.fetchall())
    games_df.drop_duplicates(inplace=True)
    with conn.begin():
        query = conn.execute(text(f'''
            SELECT * FROM nba_current_team;
        '''))
    current_teams_df = pd.DataFrame(query.fetchall())
    current_teams_df.drop_duplicates(inplace=True)
    


class Engine:

    query = ''
    table_selection_method = 'llm'
    tables = []
    selected_examples = []
    method = 'multi'
    current_generation_id = None
    cached_sql = None
    session_id = None
    thread_id = None
    labels = []

    def __init__(self, table_selection_method='llm', app='nbai'):
        self.table_selection_method = table_selection_method
        self.app = app

    def set_query(self, query):
        self.query = cleaner.clean_input(query)

    def set_session_id(self, session_id):
        self.session_id = session_id

    def set_thread_id(self, thread_id):
        self.thread_id = thread_id

    def run(self):
        yield {"status": "working", "state": "Query Received", "step": "query"}

        if self.thread_id:
            print('have thread id', self.thread_id)
            self.session_id = logging_db.get_session_id_from_thread_id(
                self.thread_id)

        if self.session_id:
            print('doing conversation')
            for resp in self.handle_conversation():
                yield {**resp, 'session_id': self.session_id}
            return

        if not self.session_id:
            new_id = logging_db.create_session(self.app)
            self.session_id = new_id

        self.current_generation_id = logging_db.log_input(
            'nbai', self.query, self.session_id)

        cached_query = logging_db.check_cached_exists(self.query)
        if cached_query:
            self.cached_sql = cached_query
            for res in self.run_cached_sql():
                yield {**res, 'session_id': self.session_id}
            return

        for res in self.get_tables():
            if res['status'] == 'error':
                return {**res, 'session_id': self.session_id}
            yield {**res, 'session_id': self.session_id}

        self.get_examples()

        for res in self.get_sql():
            if res['status'] == 'error':
                print('hit error')
                return {**res, 'session_id': self.session_id}
            yield {**res, 'session_id': self.session_id}

    def handle_conversation(self):
        return streaming_chat.route_session_response(self.query, self.session_id)

    def get_tables(self):
        yield {"status": "working", "state": "Acquiring Tables", "step": "tables"}

        try:
            new_tables, labels = get_tables(
                self.query, method=self.table_selection_method)
            self.tables = new_tables
            self.labels = labels
            self.labels += [t.upper() for t in new_tables]
            print('got tables: ', new_tables)
            print('got labels: ', labels)
            yield {"status": "working", "state": "Tables Acquired", "tables": new_tables, "step": "tables"}
        except Exception as e:
            print('error getting tables: ', e)
            yield {"status": "error", "error": str(e), 'step': 'tables'}

    def get_enums(self):
        # todo
        pass

    def get_examples(self):

        try:
            self.selected_examples = similar_examples_from_pinecone(self.query)
        except:
            pass


    def get_enriched_df(self, response):
        column_names = response.get('column_names', [])
        results = response.get('results', [])

        df = pd.DataFrame.from_records(results, columns=column_names)
        
        if 'game_id' in column_names and 'game_code' not in column_names:
            # Merge the DataFrames on the common column, e.g., 'game_id'
            df = df.merge(games_df[['game_id', 'game_code']], on='game_id', how='left')
        if 'game_code' in df.columns.tolist():
            # Transform the 'game_code' column by splitting it on '/' and getting the contents after the character
            # Then insert ' @ ' in the middle of the resulting string
            df['game_code'] = df['game_code'].apply(
                lambda x: x.split('/')[-1][:len(x.split('/')[-1])//2] + ' @ ' + x.split('/')[-1][len(x.split('/')[-1])//2:] if pd.notna(x) else None
            )
        if 'game_id' in column_names and 'game_time_et' not in column_names:
            df = df.merge(games_df[['game_id', 'game_time_et']], on='game_id', how='left')

        if 'team_id' in column_names and 'team_city' not in column_names:
            df = df.merge(current_teams_df[['team_id', 'team_city']], on='team_id', how='left')
        if 'team_id' in column_names and 'team_name' not in column_names:
            df = df.merge(current_teams_df[['team_id', 'team_name']], on='team_id', how='left')

        return df


    def get_sql(self):
        if self.method == 'multi':
            try:
                for res in streaming_sql_generation_multi.text_to_sql_with_retry_multi(self.query, self.tables, examples=self.selected_examples, session_id=self.session_id, labels=self.labels):

                    if res.get('bad_sql'):
                        num_rows = None
                        logging_db.update_input(
                            self.current_generation_id, num_rows, res['bad_sql'])

                    if res.get('sql_query'):
                        num_rows = len(
                            res.get('response', {}).get('results', []))
                        head = {
                            'columns: ': res.get('response', {}).get('column_names', []),
                            'rows': res.get('response', {}).get('results', [])[:5]
                        }

                        logging_db.update_input(
                            self.current_generation_id, num_rows, res['sql_query'], session_id=self.session_id, output_head=head)
                    
                    df = self.get_enriched_df(res.get('response', {}))
                    yield {
                        'generation_id': self.current_generation_id,
                        **res,
                        'response': {
                            "column_names": df.columns.tolist(),
                            "results": df.to_dict(orient='records'),
                            "column_types": df.apply(dtype_to_pytype).tolist()
                        },
                    }
                print('done with get_sql')
            except Exception as exc:
                print('error in get_sql: ', exc)
                return

        else:
            try:
                for res in text_to_sql_with_retry(self.query, self.tables, examples=self.selected_examples):
                    yield res
                print('done with get_sql')
            except Exception as exc:
                print('error in get_sql: ', exc)
                return

    def run_cached_sql(self):
        try:
            for res in streaming_sql_generation_multi.run_cached_sql(self.cached_sql):
                if res.get('sql_query'):
                    num_rows = len(
                        res.get('response', {}).get('results', []))
                    head = {
                        'columns: ': res.get('response', {}).get('column_names', []),
                        'rows': res.get('response', {}).get('results', [])[:5]
                    }
                    logging_db.update_input(
                        self.current_generation_id, num_rows, res['sql_query'], session_id=self.session_id, output_head=head)

                yield res
            print('done with get_sql')
        except Exception as exc:
            print('error in get_sql: ', exc)
            return
