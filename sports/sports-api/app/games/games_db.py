from typing import Dict, List

from app.config import ENGINE
from app.extensions import db
from sqlalchemy import text


def row2dict(row):
    return {key: value for key, value in row.items()}


def get_games_by_month(month=None):
    # month should be YYYY-MM
    if month:
        year_var = month.split('-')[0]
        month_var = month.split('-')[1]
        # check it's a valid month
        try:
            if int(month_var) <= 12 and int(month_var) >= 1 and len(year_var) == 4 and int(year_var):
                # check year_var is a valid year
                params = {
                    "month": int(month_var),
                    "year": int(year_var)
                }
                query = text(
                    """
                    SELECT *
                    from nba_game
                    WHERE EXTRACT(YEAR FROM game_time_utc) = :year and EXTRACT(MONTH FROM game_time_utc) = :month
                    """)
                with ENGINE.connect() as con:
                    con = con.execution_options(
                        postgresql_readonly=True
                    )
                    result = con.execute(query, params)
                    rows = result.fetchall()

                # convert to array
                games = []
                for row in rows:
                    row_as_dict = row._mapping
                    games.append(row2dict(row_as_dict))
                return games
        except Exception as e:
            print('ERROR DOWNLOADING GAMES BY MONTH: ', e)
            pass

    params = {
        "month": 3,
        "year": 2021
    }
    query = text(
        """
        SELECT *
        from nba_game
        WHERE EXTRACT(YEAR FROM game_time_utc) = :year and EXTRACT(MONTH FROM game_time_utc) = :month
        """)
    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )
        result = con.execute(query, params)
        rows = result.fetchall()
    games = []
    for row in rows:
        row_as_dict = row._mapping
        games.append(row2dict(row_as_dict))
    return games


def get_games_by_id(game_id):
    params = {
        "game_id": game_id
    }
    query = text(
        """
        SELECT *
        from nba_game
        WHERE game_id = :game_id
        """)
    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )
        result = con.execute(query, params)
        rows = result.fetchall()
    games = []
    for row in rows:
        row_as_dict = row._mapping
        games.append(row2dict(row_as_dict))
    try:
        return games[0]
    except:
        return {}


def get_games_stats_by_id(game_id):
    params = {
        "game_id": game_id
    }
    query = text(
        """
        SELECT *
        from nba_team_game_stats
        WHERE game_id = :game_id
        """)
    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )
        result = con.execute(query, params)
        rows = result.fetchall()
    teams = {}
    for row in rows:
        row_as_dict = row._mapping
        teams[row_as_dict['team_id']] = row2dict(row_as_dict)
    return teams


def get_player_games_stats_by_id(game_id):
    params = {
        "game_id": game_id
    }
    query = text(
        """
        SELECT *
FROM nba_player_game_stats AS stats

JOIN (
  SELECT person_id, name as player_name
  FROM nba_player
  GROUP BY person_id, player_name
) AS player
ON stats.person_id = player.person_id

WHERE stats.game_id = :game_id
        """)
    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )
        result = con.execute(query, params)
        rows = result.fetchall()
    players = []
    for row in rows:
        row_as_dict = row._mapping
        players.append(row2dict(row_as_dict))

    return players


def get_all_teams():
    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )

        query = text(
            """
            select team_id, team_city, team_name from nba_team
            """)

        result = con.execute(query)
        rows = result.fetchall()

    teams = []
    for row in rows:
        row_as_dict = row._mapping
        teams.append(row2dict(row_as_dict))

    # convert to a dict of team_dif: {city: city, name: name}
    teams_dict = {}
    for team in teams:
        teams_dict[team['team_id']] = {
            'city': team['team_city'], 'name': team['team_name']}

    return teams_dict


def get_boxscores(game_ids):
    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )

        params = {
            "game_ids": game_ids
        }

        query = text(
            """
            select * from nba_team_game_period_scores
            WHERE game_id = ANY(:game_ids)
            """)
        result = con.execute(query, params)
        rows = result.fetchall()

    box_scores = {}

    for row in rows:
        row_as_dict = row._mapping

        game_id = row_as_dict['game_id']
        if game_id not in box_scores:
            box_scores[game_id] = {}
        team_id = row_as_dict['team_id']
        if team_id not in box_scores[game_id]:
            box_scores[game_id][team_id] = {}
        period = row_as_dict['period']
        box_scores[game_id][team_id][period] = {
            'score': row_as_dict['score'],
            'period_type': row_as_dict['period_type'],
        }

    return box_scores


def get_player_data_by_id(person_id):
    """
    - get the info on the player by person_id
    - get the last 10 games played by the player
      - for each game, get the performance of the player along
    """

    params = {
        "person_id": person_id
    }

    query = text(
        """
SELECT
sum(ngs.points) AS total_points,
sum(ngs.field_goals_made) AS total_field_goals_made,
sum(ngs.field_goals_attempted) AS total_field_goals_attempted,
CASE
  WHEN sum(ngs.field_goals_attempted) = 0 THEN 0
  ELSE round(sum(ngs.field_goals_made) * 100.0 / sum(ngs.field_goals_attempted), 2)
END AS field_goal_percentage,
sum(ngs.three_pointers_made) AS total_three_pointers_made,
sum(ngs.three_pointers_attempted) AS total_three_pointers_attempted,
CASE
  WHEN sum(ngs.three_pointers_attempted) = 0 THEN 0
  ELSE round(sum(ngs.three_pointers_made) * 100.0 / sum(ngs.three_pointers_attempted), 2)
END AS three_point_percentage,
sum(ngs.free_throws_made) AS total_free_throws_made,
sum(ngs.free_throws_attempted) AS total_free_throws_attempted,
CASE
  WHEN sum(ngs.free_throws_attempted) = 0 THEN 0
  ELSE round(sum(ngs.free_throws_made) * 100.0 / sum(ngs.free_throws_attempted), 2)
END AS free_throw_percentage,
sum(ngs.fouls_personal) AS total_personal_fouls,
sum(ngs.rebounds_offensive) AS total_offensive_rebounds,
sum(ngs.rebounds_defensive) AS total_defensive_rebounds,
sum(ngs.rebounds_total) AS total_rebounds,
sum(ngs.assists) AS total_assists,
sum(ngs.steals) AS total_steals,
sum(ngs.blocks) AS total_blocks,
sum(ngs.turnovers) AS total_turnovers
FROM
nba_player_game_stats ngs
where person_id=:person_id
  """)

    with ENGINE.connect() as con:
        con = con.execution_options(
            postgresql_readonly=True
        )
        result = con.execute(query, params)
        rows = result.fetchone()
    player_stats = {}
    if rows:
        row_as_dict = rows._mapping
        player_stats = row2dict(row_as_dict)

    return player_stats
