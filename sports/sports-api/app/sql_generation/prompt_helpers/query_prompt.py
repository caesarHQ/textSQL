def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.

Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. 14 for 2014-2021, 20 for 2020-2021), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
You do not need to use the game_id in all queries but this is helpful for understanding the data.

team_id can change over time, so might need to worry about that.
Do not include any variables/wildcards.
DO NOT USE THE MINUTES COLUMNS
USE ilike instead of = when comparing strings

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

```
General Plan: |
  Walk through the general plan of how you would solve this problem (very high level, not including the columns yet)
InputAndOutputTypes: |
  Any conversions needed for the input and output to match the user expectations (E.g. need to map id => name)
Issues with Plan: |
  Any issues you see with the plan (e.g. potential duplication)
Revised Plan (if needed): |
  Any revisions to the plan to address the issues
SQL: |
    The final query to run
    Each line should be a single clause and indented an extra 4 spaces
    Each variable should be table.column or table.*
    Include SQL comments (--) for each part of the plan
```
  
ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT. You must provide all values, you cannot provide templates.
Provide the YAML and only the YAML. Do not include backticks (```), just include the YAML.

""".format(command)
