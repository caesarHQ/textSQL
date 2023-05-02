

def command_prompt_cte(command, labels=[]):

    query_specific_injects = []

    print('labels: ', labels)

    if 'REGULAR' in labels:
        query_specific_injects.append(
            """The prefix 002 is used for regular season games, to query for regular season games, filter on game_id like '002%'""")
    if 'PLAYOFF' in labels:
        query_specific_injects.append(
            """The prefix 004 is used for playoff games, to query for playoff games, filter on game_id like '004%'""")
    if 'ALL STAR' in labels:
        query_specific_injects.append(
            """The prefix 005 is used for all star games, to query for all star games, filter on game_id like '005%'""")
    if 'PRESEASON' in labels:
        query_specific_injects.append(
            """The prefix 001 is used for preseason games, to query for preseason games, filter on game_id like '001%'""")

    if 'SEASON' in labels:
        query_specific_injects.append('''Note: The NBA's Game ID is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year.
To get seasons, 
e.g. for the current 2022-23 season, you need to filter where game_id like '00222%',
for the 2021-22 season, you need to filter where game_id like '00221%',
etc
You do not need to use the game_id in all queries but this is helpful for understanding the data.''')

    if 'NBA_GAME' in labels:
        query_specific_injects.append('''  If querying NBA_GAME:
  - nba_game does not include the winner/loser or the team names.
    to find a winner, you first need to need to check against nba_team_game_stats to get the final scores for the away/home team based on the game_id and home/away team_id.''')

    if 'NBA_TEAM_GAME_STATS' in labels:
        query_specific_injects.append('''    If querying NBA_TEAM_GAME_STATS:
  - nba_team_game_stats does not include the team names.
  - nba_team_game_stats will have one row for the home team and one row for the away team for each game.''')

    if len(query_specific_injects) > 0:
        query_specific_injects = [''] + query_specific_injects + ['']
    query_specific_injects = '\n'.join(query_specific_injects)

    return f"""You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {command}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.
{query_specific_injects}
Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.

Do not include any variables/wildcards.

USE ilike instead of = when comparing strings

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
Spelled out question: |
  Rephrase out the question into who/what/why/when - e.g. "has any" should be "who"
Reverse Walk Through: |
  So a child can understand, walk through an natural language plan in reverse order
General Plan Start to Finish: |
  Walk through the prompt for a child to understand the plan from the final query to the start, just naming the CTE that is needed (but not the full text)
SQL: |
    The final query to run
    Each line should be a single clause and indented an extra 4 spaces
    Each variable should be table.column or table.*
    Include SQL comments (--) for each part of the plan
```
  
ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT. You must provide all values, you cannot provide templates.
Provide the YAML and only the YAML. Do not include backticks (```), just include the YAML. 

FINALLY: ALL QUERIES MUST REFERENCE THE TABLE AND COLUMN FOR EACH QUERY IN TABLE.COLUMN FORMAT. Especially for GAME_ID, ensure that the table that you're referencing is always explicit.

"""


def followup_prompt_cte(command, labels=[]):

    query_specific_injects = []

    print('labels: ', labels)

    if 'REGULAR' in labels:
        query_specific_injects.append(
            """The prefix 002 is used for regular season games, to query for regular season games, filter on game_id like '002%'""")
    if 'PLAYOFF' in labels:
        query_specific_injects.append(
            """The prefix 004 is used for playoff games, to query for playoff games, filter on game_id like '004%'""")
    if 'ALL STAR' in labels:
        query_specific_injects.append(
            """The prefix 005 is used for all star games, to query for all star games, filter on game_id like '005%'""")
    if 'PRESEASON' in labels:
        query_specific_injects.append(
            """The prefix 001 is used for preseason games, to query for preseason games, filter on game_id like '001%'""")

    if 'SEASON' in labels:
        query_specific_injects.append('''Note: The NBA's Game ID is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year.
To get seasons, 
e.g. for the current 2022-23 season, you need to filter where game_id like '00222%',
for the 2021-22 season, you need to filter where game_id like '00221%',
etc
You do not need to use the game_id in all queries but this is helpful for understanding the data.''')

    if 'NBA_GAME' in labels:
        query_specific_injects.append('''  If querying NBA_GAME:
  - nba_game does not include the winner/loser or the team names.
    to find a winner, you first need to need to check against nba_team_game_stats to get the final scores for the away/home team based on the game_id and home/away team_id.''')

    if 'NBA_TEAM_GAME_STATS' in labels:
        query_specific_injects.append('''    If querying NBA_TEAM_GAME_STATS:
  - nba_team_game_stats does not include the team names.
  - nba_team_game_stats will have one row for the home team and one row for the away team for each game.''')

    if len(query_specific_injects) > 0:
        query_specific_injects = [''] + query_specific_injects + ['']
    query_specific_injects = '\n'.join(query_specific_injects)

    return f"""You are an expert SQL programmer helping a user find information in a database.
    
Given the prior SQL, update the query given the new request: {command}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.
{query_specific_injects}
Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.

Do not include any variables/wildcards.

USE ilike instead of = when comparing strings

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
Changes to the Original SQL: |
  Explain in simple words a five year old can understand what needs to be changed in the original sql.
SQL: |
    The final query to run
    Each line should be a single clause and indented an extra 4 spaces
    Each variable should be table.column or table.*
    Include SQL comments (--) for each part of the plan
```
"""


def simple_followup_prompt_cte(command):

    return f"""You are an expert SQL programmer helping a user find information in a database.
    
Provide an updated version of the last SQL to answer: {command}

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
Original Question: | 
  Explain the original question and how the current question relates to it
Changes to the Original SQL: |
  Explain in simple words a five year old can understand what needs to be changed in the original sql.
SQL: |
  The new query to run
```

ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT. You must provide all values, you cannot provide templates.
Provide the YAML and only the YAML. Do not include backticks (```), just include the YAML. 
"""
