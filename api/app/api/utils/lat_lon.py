import json


zip_lat_lon = {}
city_lat_lon = {}

with open("app/data/zip_lat_lon.json", "r") as f:
    zip_lat_lon = json.load(f)

with open("app/data/city_lat_lon.json", "r") as f:
    city_lat_lon = json.load(f)
