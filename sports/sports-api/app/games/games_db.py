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
