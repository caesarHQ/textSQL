
from collections import OrderedDict
from sqlalchemy import text

from app.config import ENGINE
from ..geo_data import city_lat_lon, neighborhood_shapes, zip_lat_lon




class NotReadOnlyException(Exception):
    pass


class CityOrCountyWithoutStateException(Exception):
    pass


class NullValueException(Exception):
    pass


def execute_sql(sql_query: str):
    if not is_read_only_query(sql_query):
        raise NotReadOnlyException("Only read-only queries are allowed.")

    with ENGINE.connect() as connection:
        connection = connection.execution_options(
            postgresql_readonly=True
        )
        with connection.begin():
            sql_text = text(sql_query)
            result = connection.execute(sql_text)

        column_names = list(result.keys())
        if 'state' not in column_names and any(c in column_names for c in ['city', 'county']):
            raise CityOrCountyWithoutStateException("Include `state` in the result table, too.")

        rows = [list(r) for r in result.all()]

        # Add lat and lon to zip_code
        zip_code_idx = None
        try:
            zip_code_idx = column_names.index("zip_code")
        except ValueError:
            zip_code_idx = None

        if zip_code_idx is not None:
            column_names.append("lat")
            column_names.append("long")
            for row in rows:
                zip_code = row[zip_code_idx]
                lat = zip_lat_lon.get(zip_code, {}).get('lat')
                lon = zip_lat_lon.get(zip_code, {}).get('lon')
                row.append(lat)
                row.append(lon)

        # No zip_code lat lon, so try to get city lat lon
        else:
            # Add lat and lon to city
            city_idx = None
            state_idx = None
            try:
                city_idx = column_names.index("city")
                state_idx = column_names.index("state")
            except ValueError:
                city_idx = None
                state_idx = None

            if city_idx is not None and state_idx is not None:
                column_names.append("lat")
                column_names.append("long")
                for row in rows:
                    city = row[city_idx]
                    state = row[state_idx]
                    lat = city_lat_lon.get(state, {}).get(city, {}).get('lat')
                    lon = city_lat_lon.get(state, {}).get(city, {}).get('lon')

                    if "St." in city:
                        new_city = city.replace("St.", "Saint")
                        lat = city_lat_lon.get(state, {}).get(new_city, {}).get('lat')
                        lon = city_lat_lon.get(state, {}).get(new_city, {}).get('lon')

                    row.append(lat)
                    row.append(lon)

        results = []
        for row in rows:
            result = OrderedDict()
            for i, column_name in enumerate(column_names):
                result[column_name] = row[i]
            results.append(result)

        return {
            'column_names': column_names,
            'results': results,
        }


def is_read_only_query(sql_query: str):
    """
    Checks if the given SQL query string is read-only.
    Returns True if the query is read-only, False otherwise.
    """
    # List of SQL statements that modify data in the database
    modifying_statements = ["INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "GRANT", "TRUNCATE", "LOCK TABLES", "UNLOCK TABLES"]

    # Check if the query contains any modifying statements
    for statement in modifying_statements:
        if not sql_query or statement in sql_query.upper():
            return False

    # If no modifying statements are found, the query is read-only
    return True
