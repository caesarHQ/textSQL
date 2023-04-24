def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted JSON object with the following information. Ensure to escape any special characters so it can be parsed as JSON.


Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. 14 for 2014-15), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
You do not need to use the game_id in all queries but this is helpful for understanding the data.

For instance, to get Lebron's avg score per season, you can run
```
WITH lebron_james AS (\\n    SELECT np.person_id\\n    FROM nba_player np\\n    WHERE np.first_name = 'LeBron' AND np.family_name = 'James'\\n    limit 1\\n),\\nscore_per_season as(\\n    SELECT\\n        SUBSTRING(ngs.game_id, 1, 3) || '-' || SUBSTRING(ngs.game_id, 4, 2) AS season,\\n        sum(ngs.points) AS total_points\\n    FROM\\n        nba_player_game_stats ngs\\n        JOIN lebron_james lj ON ngs.person_id = lj.person_id\\n    WHERE\\n        ngs.person_id = lj.person_id\\n    GROUP BY\\n        season\\n)\\nselect avg(score_per_season.total_points)\\nfrom score_per_season
```

team_id can change over time, so might need to worry about that.

DO NOT USE THE MINUTES COLUMNS

{{

    "Required Answer": str, required (the type of information the query is asking for),
    "Input Types": str, required (a summary of the enums or other conversion that are related to the query),
    "Plan": str, required (walk thru each sub-part of the problem to build the final answer),
    "Likely subquery titles": str[], required (tables to make in the CTE, where certain data (e.g. game time) is only in another table)
    "Funky Types": str[], required (types which are funky so can't use avg etc on them - avoid using these if possible),
    "SQL": str, required (formatted '''line1\\nnext line\\netc''')
}}

Provide the JSON and only the JSON. It should be formatted for parsing in Python. Ensure everything inside the SQL statement is properly escaped for parsing and executing (ensure \n is \\n, \m is \\m etc).
Do not include any variables/wildcards.
""".format(command)
