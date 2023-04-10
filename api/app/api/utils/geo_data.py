import json


zip_lat_lon = {}
with open("app/data/zip_lat_lon.json", "r") as f:
    zip_lat_lon = json.load(f)

city_lat_lon = {}
with open("app/data/city_lat_lon.json", "r") as f:
    city_lat_lon = json.load(f)

neighborhood_shapes = {}
# with open("app/data/sf_neighborhoods.json", "r") as f:
with open("app/data/sf_analysis_neighborhoods.json", "r") as f:
    neighborhood_shapes = json.load(f)