def command_prompt_cte(command):
    return """You are an expert and empathetic database engineer that is generating correct read-only postgres query to answer the following question/command: {}

Ensure to include which table each column is from (table.column)
Use CTE format for computing subqueries.

Provide a properly formatted YAML object with the following information. Ensure to escape any special characters so it can be parsed as YAML.


Note: The NBA's Game ID, 0021400001, is a 10-digit code: XXXYYGGGGG, where XXX refers to a season prefix, YY is the season year (e.g. 14 for 2014-15), and GGGGG refers to the game number (1-1230 for a full 30-team regular season).
You do not need to use the game_id in all queries but this is helpful for understanding the data.

For instance, to get Lebron's avg score per season, you can run
```
WITH lebron_james AS (\\n    SELECT np.person_id\\n    FROM nba_player np\\n    WHERE np.first_name = 'LeBron' AND np.family_name = 'James'\\n    limit 1\\n),\\nscore_per_season as(\\n    SELECT\\n        SUBSTRING(ngs.game_id, 1, 3) || '-' || SUBSTRING(ngs.game_id, 4, 2) AS season,\\n        sum(ngs.points) AS total_points\\n    FROM\\n        nba_player_game_stats ngs\\n        JOIN lebron_james lj ON ngs.person_id = lj.person_id\\n    WHERE\\n        ngs.person_id = lj.person_id\\n    GROUP BY\\n        season\\n)\\nselect avg(score_per_season.total_points)\\nfrom score_per_season
```

team_id can change over time, so might need to worry about that.
Do not include any variables/wildcards.
DO NOT USE THE MINUTES COLUMNS

---
Funky Types: required (types which are funky so can't use avg etc on them -
  avoid using these if possible)
Input Types: required (a summary of the enums or other conversion that are related
  to the query)
Likely subquery titles: required (tables to make in the CTE, where certain data (e.g. game time) is only in another table)
Plan: required (walk thru each sub-part of the problem to build the final answer)
SQL: required (the final query)
---

Provide the YAML and only the YAML. It should be formatted for parsing in Python YAML files. The keys and values should be on the same lines - DO NOT ADD NEWLINES AFTER KEYS.
""".format(command)
