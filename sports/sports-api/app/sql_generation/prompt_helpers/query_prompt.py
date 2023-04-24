def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted JSON object with the following information. Ensure to escape any special characters so it can be parsed as JSON.


Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. 14 for 2014-15), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
You do not need to use the game_id in all queries but this is helpful for understanding the data.

For instance, to get Lebron's avg score per season, you can run
```
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
select avg(total_points)
from score_per_season
```

{{

    "Required Answer": str, required (the type of information the query is asking for),
    "Input Types": str, required (a summary of the enums or other conversion that are related to the query),
    "Plan": str, required (a step by step walk thru of the joins/filters to be done and how to ensure uniqueness/deduplication),
    "Funky Types": str[], required (types which are funky so can't use avg etc on them - avoid using these if possible),
    "Likely subquery titles": str[], required (tables to make in the CTE)
    "SQL": str, required (formatted '''line1\\nnext line\\netc''')
}}

Provide the JSON and only the JSON. It should be formatted for parsing in Python. Ensure everything inside the SQL statement is properly escaped for parsing and executing (ensure \n is \\n, \m is \\m etc).
Do not include any variables/wildcards.
""".format(command)
