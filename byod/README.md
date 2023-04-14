# 🔌 Text-to-SQL BYOD (Bring Your Own Data)


You can now connect your own database & datasets to textSQL and self-host the service. Our vision is to continue to modularize and improve this process.

## Use cases

- Public-facing interactive interfaces for data. Democratizing public data
- Empowering researchers. Enabling journalists and other researchers to more easily explore data
- Business intelligence. Reducing the burden on technical employees to build & run queries for non-technical


## Setup instructions

These instructions will walk you through running your own API and client. You can run this all on localhost and then deploy it wherever you would like.

### API

#### Prerequisites
- `python3.10`

#### Required configuration for development

- OpenAI Key
- URL to the postgres DB

Configure the above in `.env` in the following path `/byod/api/app/`

Here's an example of `.env` file that points to the CensusGPT Postgres database

```
OPENAI_KEY="YOUR_OPENAI_KEY"
DB_URL="postgresql://census_data_user:3PjePE3hVzm2m2UFPywLTLfIiC6w28HB@dpg-cg73gvhmbg5ab7mrk8qg-b.replica-cyan.oregon-postgres.render.com/census_data_w0ix"
```

#### Local development

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

### Client

You can build your own front-end or use the one in BYOD (built on streamlit).


