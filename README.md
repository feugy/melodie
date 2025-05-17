# Install

This project is using [bun](https://bun.sh/docs/installation#installing) runtime.

First, install dependencies:

```shell
bun i
```

Then release the application (by default arm64):

```shell
bun release --cpu x64
```

You can start the app now:

```shell
cd build
./melodie
```

# Develop

Because bun hides some of the output lines, the simplest is to run command inside individual folders within `apps/`

To run all tests: `bun run -F '*' --elide-lines=0 test`

## apps/common

Contains common code between the agent and the web UI.

- one-shot tests: `bun test`
- watch mode tests: `bun dev`

## apps/server

Server is indexing and watching local folders. It also embeds the Web UI.

- one-shot tests: `bun test`
- watch mode tests: `bun dev`
- standalone start: `bun start`

## apps/web

Web UI.

- one-shot tests: `bun run test`
- watch mode tests: `bun dev`
- component dev with Storybook: `bun dev:storybook`
- standalone start with hot reload: `bun start`
