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
  
  If querying NBA_GAME:
  - nba_game does not include the winner/loser or the team names.
    to find a winner, you first need to need to check against nba_team_game_stats to get the final scores for the away/home team based on the game_id and home/away team_id.

  If querying NBA_TEAM_GAME_STATS:
  - nba_team_game_stats does not include the team names.
  - nba_team_game_stats will have one row for the home team and one row for the away team for each game.
    

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
Spelled out question: |
  Spell out the question so a five year old can understand it (include what should be returned at the end)
InputAndOutputTypes: |
  Any conversions made so the output will be understandable by the user (e.g. should averages be over game, over season? how would final answers be calculated)
General Plan Start to Finish: |
  Perform an ELI5 walk through of the plan from the final query to the the start explaining what you'll need for each step
SQL: |
    The final query to run
    Each line should be a single clause and indented an extra 4 spaces
    Each variable should be table.column or table.*
    Include SQL comments (--) for each part of the plan
```
  
ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT. You must provide all values, you cannot provide templates.
Provide the YAML and only the YAML. Do not include backticks (```), just include the YAML. Also, ensure all column references unambiguously provide table.column when using them.

""".format(command)
