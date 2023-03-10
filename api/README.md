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
