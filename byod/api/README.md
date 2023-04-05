# TextSQL API

A Flask API for Text-to-SQL

## Prerequisites
- `python3.10`

## Required configuration for development:
- OpenAI Key
- URL to the postgres DB

Configure the above in `.env`. Refer to `.env.example`.

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
