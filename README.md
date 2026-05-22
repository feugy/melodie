# Install

This project is using [bun](https://bun.sh/docs/installation#installing) runtime.

First, install dependencies:

```shell
bun i
```

Then release the application (by default x64 CPU and darwin OS):

```shell
bun release --cpu x64 --os linux
```

You can start the app now:

```shell
cd build
./melodie
```

# Develop

On the very first run:

```shell
# install all dependencies
bun i
# compile web to make it available to server
cd apps/web
bun run build
bun run start
```

In a different terminal, start and configure the server for the very first time.
Provide unpriviledge port like 3000

```shell
cd apps/server
bun run start
```

You'll need a user. In a different terminal, run this single time command:

```shell
cd apps/server
bun start add-user -n username -p password
```

!!Temporary!!
you'll need to change your agent base URL. Provide the same port as in your configuration:

```sql
update agents set base='http://localhost:3000'
```

Then you're good to login with the user and listen to your local music!


Because bun hides some of the output lines, the simplest is to run command inside individual folders within `apps/`

To run all tests: `bun run -F '*' --elide-lines=0 test`

## apps/common

Contains common code between the agent and the web UI.

- one-shot tests: `bun run test`
- watch mode tests: `bun dev`

## apps/server

Server is indexing and watching local folders. It also embeds the Web UI.

- one-shot tests: `bun run test`
- watch mode tests: `bun dev`
- standalone start: `bun start`

To add new users to DB:

```shell
bun start add-user -n username -p password
```

To refresh TLS certificates:

```shell
bun start refresh-certs -e email -p port
```

## apps/web

Web UI.

- one-shot tests: `bun run test`
- watch mode tests: `bun dev`
- component dev with Storybook: `bun dev:storybook`
- standalone start with hot reload: `bun start`
