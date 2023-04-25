def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.


Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. 14 for 2014-15), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
You do not need to use the game_id in all queries but this is helpful for understanding the data.

For instance, to get Lebron's avg score per season, you can run
SQL | 
    WITH lebron_james AS (
        SELECT np.person_id
        FROM nba_player np
        WHERE np.first_name = 'LeBron' AND np.family_name = 'James'
        limit 1
    ),
    score_per_season as(
        SELECT
            SUBSTRING(ngs.game_id, 1, 3) || '-' || SUBSTRING(ngs.game_id, 4, 2) AS season,
            sum(ngs.points) AS total_points
        FROM
            nba_player_game_stats ngs
            JOIN lebron_james lj ON ngs.person_id = lj.person_id
        WHERE
            ngs.person_id = lj.person_id
        GROUP BY
            season
    )
    select avg(score_per_season.total_points)
    from score_per_season



team_id can change over time, so might need to worry about that.
Do not include any variables/wildcards.
DO NOT USE THE MINUTES COLUMNS
USE ilike instead of = when comparing strings

Provide the following YAML. Remember to indent with 4 spaces and use the correct YAML syntax using the following format:

Funky Types: |
  describe any types which are funky so can't use avg etc on them, or write "none"
Input Types: |
  a summary of the enums or other conversion that are related to the query
Likely subquery titles | 
  tables to make in the CTE, where certain data (e.g. game time) is only in another table
Plan |
  walk thru each sub-part of the problem to build the final answer, noting any constraints (or lack thereof) and any assumptions made
SQL |
  the final query to run
  each line should be a single clause and indented an extra 4 spaces

ENSURE TO PROVIDE A | AFTER EACH YAML KEY SO THE YAML IS NOT INTERPRETED AS A COMMENT

""".format(command)
