# API for textSQL

## Prerequisites
- `python3.10`

## Required configuration for development:
- OpenAI Key
- URL to the postgres DB (Read-only URL provided in `config.py`)

Configure the above in `app/config.py`

## Local development

Initial setup
```sh
$ ./scripts/setup.sh
```

Activate virtual env
```sh
$ source ./venv/bin/activate
```

Run local instance
```sh
$ ./scripts/dev.sh
```

### Test case queries to test out prompt or other API related changes:

```
- Three highest income zipcodes in {City}
- Five zipcodes in {State} with the highest income and hispanic population of at least 10,000
- Which 3 zipcodes in {City} have the highest female to male ratio?
- Which zipcode in {City} has the most racial diversity and what is the racial distribution?
- 10 highest crime cities in {State}
- Which 20 zipcodes in {State} have median income that's closes to the national median income?
```
