# To fix/do

- authentication
- Consider Github for CI

## Common

- unknown album & artists should be null and not strings

## Server

- worker: tests. resume on failure
- (idea) track's primary key could be composite of id + agentId (allows multiple agent on different file systems)

## Web

- feedback when adding to the queue (large & narrow screens)
- play/enqueue test for albums

# Architecture design

Server is a CLI tool intended to perpetually run close to images and music files (media files).
This allows keeping media files local, but is a challenge since agent needs public network connectivity.
Web is a Sveltekit application providing a GUI for browsing and playing media files.

We have several options for composing these two applications.

## SPA + agent

Server would be an agent serving media files, and providing endpoints for accessing the database.
Web would use endpoints to operate.
Pros: Web can be hosted on a public platform, which guarantees availability, URL and SSL.
Cons: Web would require CORS to access Server, not SSL between Server and Web (could be fixed with LetsEncrypt).

## Standalone server

Server would serve media files and host Web application.
Web would directly hit the database.
Pros: self-contained, no dependencies, snappier thanks to direct DB accesses.
Cons: complex LetsEncrypt setup to get SSL certificates.

# Usefull

- organize all imports: `bunx biome check --formatter-enabled=false --linter-enabled=false --organize-imports-enabled=true --write ./apps`
- run as a service on VM

  - sudo systemctl edit melodie.service --full --force
  - sudo systemctl enable melodie.service
  - systemctl status melodie.service
  - journalctl -u melodie.service

    ```
    [Unit]
    Description=Melodie music server
    After=network-online.target

    [Service]
    Type=simple
    User=freebox
    Group=freebox
    ExecStart=/home/freebox/melodie/melodie --server -p 8081 -f /mnt/Dock/Musique
    WorkingDirectory=/home/freebox/melodie
    Restart=on-failure
    TimeoutStopSec=30

    [Install]
    WantedBy=multi-user.target
    ```
