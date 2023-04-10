import requests
from flask import Blueprint, jsonify, request

plugin = Blueprint('plugin', __name__)

@plugin.route('get_census_data', methods=['GET'])
def get_census_data_get():
  """
  Get census data based on the question
  """

  question = request.args.get('question')
  if not question:
    return jsonify({
      "error": "question is missing from the request args"
    })

  raw_table_json = requests.post('https://text-sql-be.onrender.com/api/get_tables', json={"natural_language_query": question})

  print('raw table: ', raw_table_json.json())

  newJson = {
      **raw_table_json.json(),
      "natural_language_query": question,
  }

  print('new json: ', newJson)

  final_res = requests.post('https://text-sql-be.onrender.com/api/text_to_sql', json=newJson)

  print('final res: ', final_res.json())

  parsed = final_res.json()
  
  resultsData = parsed['result']['results']
  sqlData = parsed['sql_query']

  return jsonify({
    "answer": resultsData,
    "sql_query": sqlData,
  })


plugin_config = Blueprint('plugin_config', __name__)
@plugin_config.route("/.well-known/ai-plugin.json")
def openapi_json():
  current_domain = request.host_url
  print('request to :', current_domain, '\n')
  return jsonify({
    "schema_version": "v1",
    "name_for_human": "censusGPT",
    "name_for_model": "census_data_and_sql_queries",
    "description_for_human": "censusGPT",
    "description_for_model": "CensusGPT provides information derived from the 2020 US Census. The data is provided as a chart along with the SQL query used to calculate it.",
    "auth": {
      "type": "none"
    },
    "api": {
      "type": "openapi",
      "url": f"{current_domain}openapi.yaml",
      "is_user_authenticated": False
    },
    "logo_url":"https://censusgpt.com/logo192.png",
    "contact_email": "rahul@caesarhq.com",
    "legal_info_url": "https://censusgpt.com/privacy"
  })

@plugin_config.route("/openapi.yaml")
def openapi_yaml():
    current_domain = request.host_url
    return f"""components:
  schemas:
    CensusResponse:
      properties:
        answer:
          description: the answer to the question
          type: string
        sql_query:
          description: the sql query that generated the answer
          type: string
      type: object
info:
  description: Data from the US Census
  title: Census Data
  version: '1.0'
openapi: 3.0.2
paths:
  /plugin/get_census_data:
    get:
      consumes:
      - application/json
      description: Provide census data for questions about populations and other location
        information. This provides data from the 2020 census.
      operationId: getCensusData
      parameters:
      - description: the question to ask the census data
        in: query
        name: question
        required: false
        schema:
          type: string
      responses:
        default:
          description: ''
          schema:
            $ref: '#/components/schemas/CensusResponse'
      tags:
      - Census Data
    options:
      consumes:
      - application/json
      description: Provide census data for questions about populations and other location
        information. This provides data from the 2020 census.
      operationId: getCensusData
      parameters:
      - description: the question to ask the census data
        in: query
        name: question
        required: false
        schema:
          type: string
      responses:
        default:
          description: ''
          schema:
            $ref: '#/components/schemas/CensusResponse'
      tags:
      - Census Data
servers:
- url: {current_domain}"""