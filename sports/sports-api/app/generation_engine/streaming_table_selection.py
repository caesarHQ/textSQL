from app.sql_generation.prompt_helpers.table_prompt import get_relevant_tables_from_lm


def get_tables(natural_language_query, ignore_comments=False, method='llm'):
    print('getting tables for: ', natural_language_query, ' using ', method)
    if method == 'llm':
        return get_relevant_tables_from_lm(natural_language_query, ignore_comments)
    else:
        return None
