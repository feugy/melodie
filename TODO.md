# To fix/to

## Common

- db pool not used or misused
- configure logger with env vars
- migration in production?
- unknown album & artists should be null and not strings

## Agent

- check for certutils: `sudo apt-get install libnss3-tools` when receiving `Error: certutil not found at nssVerifyCertutil`
- (idea) track's primary key could be composite of id + agentId (allows multiple agent on different file systems)

## Web

- tracks-queue tests
- storybook for Image
- (research) make the list super snappy with [CSS containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Using_CSS_containment)

# Usefull

- some dependencies like knex, pg and pino must not be devDependencies or vite will bundle them.
- organize all imports: `pnpm exec biome check --formatter-enabled=false --linter-enabled=false --organize-imports-enabled=true --write ./apps`
- run folders tests with meaningful output: `pnpm -F agent dev --reporter=basic`
- in Postgres, we need a test user that can create other database (`createdb` permission)

# Posgres for dummies:

- connect to 'databse': `psql postgresql://user:password@localhost:5432/database`
- list tables: `\dt`
- list databases: `\l`
- create user: `create user melodie_test with nosuperuser createdb password 'xxx';`
- create databse: `create database xyz;`
- change database owner: `alter database xyz owner to yzx;`
