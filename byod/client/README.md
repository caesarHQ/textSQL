# TextSQL front-end

A front-end streamlit application for Text-to-SQL

## Prerequisites
`python3.10`

## Required configuration for development:
- base URL for TextSQL API

Configure the above in `.env`. Refer to `.env.example`.

## Local development

Initial setup
```
$ ./scripts/setup.sh
```

Activate virtual env
```
$ source ./venv/bin/activate
```

Run local instance
```
$ ./scripts/dev.sh
```