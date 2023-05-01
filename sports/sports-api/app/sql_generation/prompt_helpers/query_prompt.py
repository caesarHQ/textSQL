def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.

Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. XXX14 for 2014-2015, XXX20 for 2020-2021), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
You do not need to use the game_id in all queries but this is helpful for understanding the data.

team_id can change over time, so might need to worry about that.
Do not include any variables/wildcards.
DO NOT USE THE MINUTES COLUMNS
USE ilike instead of = when comparing strings

Notes on table relationships:
  If querying NBA_TEAM:
  - nba_team.team_id is not unique. To find a team, search by the team name (not including the city)
  you cannot join on nba_team by team_id directly because this will return multiple rows  
  - nba_team has team_name and team_city. generally just query against the team_name (e.g. knicks)
  
  If querying NBA_GAME:
  - nba_game does not include the winner/loser or the team names.
    to find a winner, you first need to select distinct team_id from the nba_team table via CTE. You then need to check against nba_team_game_stats to get the final scores for the away/home team based on the game_id and home/away team_id.

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
Spelled out question: |
  Spell out the question so a five year old can understand it
General Plan from End to Start: |
  Explain so a five year old can understand how you'll get to the final answer from back to start
InputAndOutputTypes: |
  Any conversions needed for the input and output to match the user expectations (E.g. need to map id => name)
Non-unique issues to watch for: |
  List anything related to joins to watch out for. Are there any tables that don't actually need to be pre-computed?
Final Plan Start to Finish: |
  Walk through the CTEs from start to finish so a five year old can understand why each step is needed.
SQL: |
    The final query to run
    Each line should be a single clause and indented an extra 4 spaces
    Each variable should be table.column or table.*
    Include SQL comments (--) for each part of the plan
```
  
ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT. You must provide all values, you cannot provide templates.
Provide the YAML and only the YAML. Do not include backticks (```), just include the YAML. Also, ensure all column references unambiguously provide table.column when using them.

""".format(command)
