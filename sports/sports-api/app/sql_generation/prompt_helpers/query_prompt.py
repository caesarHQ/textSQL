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
Include SQL comments (--) before each major clause to explain what it does (e.g. --get the unique X from Y to avoid duplicates)

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

Funky Types: |
  describe any types which are funky so can't use avg etc on them, or write "none"
Input Types: |
  a summary of the enums or other conversion that are related to the query
Likely subquery titles | 
  tables to make in the CTE, where certain data (e.g. game time) is only in another table
Plan |
  walk thru each sub-part of the problem to build the final answer, noting any constraints (or lack thereof) and any assumptions made.
  include what CTEs to run (although this doesn't need to be followed exactly)
SQL |
  the final query to run
  each line should be a single clause and indented an extra 4 spaces

ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT. You must provide all values, you cannot provide templates.

""".format(command)
