from app.generation_engine.streaming_table_selection import get_tables
from app.generation_engine.streaming_sql_generation import text_to_sql_with_retry
from app.generation_engine import streaming_sql_generation_multi
from app.generation_engine.example_picker import similar_examples_from_pinecone
from app.generation_engine.utils import cleaner
from app.databases import logging_db
from app.generation_engine import streaming_chat


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
        return streaming_chat.handle_response(self.query, self.session_id)

    def get_tables(self):
        yield {"status": "working", "state": "Acquiring Tables", "step": "tables"}

        try:
            new_tables = get_tables(
                self.query, method=self.table_selection_method)
            self.tables = new_tables
            print('got tables: ', new_tables)
            yield {"status": "working", "state": "Tables Acquired", "tables": new_tables, "step": "tables"}
        except Exception as e:
            yield {"status": "error", "error": str(e), 'step': 'tables'}

    def get_enums(self):
        # todo
        pass

    def get_examples(self):

        try:
            self.selected_examples = similar_examples_from_pinecone(self.query)
        except:
            pass

    def get_sql(self):
        if self.method == 'multi':
            try:
                for res in streaming_sql_generation_multi.text_to_sql_with_retry_multi(self.query, self.tables, examples=self.selected_examples, session_id=self.session_id):

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

                    yield {'generation_id': self.current_generation_id, **res}
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
                yield res
            print('done with get_sql')
        except Exception as exc:
            print('error in get_sql: ', exc)
            return
