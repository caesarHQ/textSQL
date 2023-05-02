def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.

Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year.
To get seasons, 
e.g. for the current 2022-23 season, you need to filter where game_id like '00222%',
for the 2021-22 season, you need to filter where game_id like '00221%',
etc

You do not need to use the game_id in all queries but this is helpful for understanding the data.

team_id can change over time, so might need to worry about that.
Do not include any variables/wildcards.
DO NOT USE THE MINUTES COLUMNS
USE ilike instead of = when comparing strings

Notes on table relationships:
  
  If querying NBA_GAME:
  - nba_game does not include the winner/loser or the team names.
    to find a winner, you first need to need to check against nba_team_game_stats to get the final scores for the away/home team based on the game_id and home/away team_id.

  For 

  If querying NBA_TEAM_GAME_STATS:
  - nba_team_game_stats does not include the team names.
  - nba_team_game_stats will have one row for the home team and one row for the away team for each game.
    

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
Spelled out question: |
  Spell out the question so a five year old can understand it (include what should be returned at the end)
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

""".format(command)
