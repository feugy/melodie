# To fix/do

- Consider Github for CI

## Common

- TOFIX: await usersModel.list() always returns a result with undefined name
- unknown album & artists should be null and not strings

## Server

- worker: tests. resume on failure
- (idea) track's primary key could be composite of id + agentId (allows multiple agent on different file systems)

## Web

- on mobile, autoplay stops while loading next track
- feedback when adding to the queue (large & narrow screens)
- play/enqueue test for albums: order is often wrong when adding from the list (ok from details)
- store volume in local storage
- styles are awful

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
- move to VM (osx commands)

  1. `bun run release --cpu arm64 --os linux`
  1. `COPYFILE_DISABLE=1 tar -cvf melodie.tar --exclude='.?*' --exclude='./.?*' --exclude='*/.?*' -C build .`
  1. `scp melodie.tar freebox@192.168.1.10:~/melodie`
  1. (on the VM) `cd melodie && tar -xf melodie.tar && sudo systemctl restart melodie.service`

- refresh certificates

  1. `sudo systemctl stop melodie.service`
  1. `./melodie refresh-certs -e pioupiou@gmail.com -c .melodie -p 8081`
  1. `sudo systemctl start melodie.service`

- run as a service on VM

  1. `sudo systemctl edit melodie.service --full --force`
  1. `sudo systemctl enable melodie.service`
  1. `systemctl status melodie.service`
  1. `journalctl -r -u melodie.service`

  ```
  [Unit]
  Description=Melodie music server
  After=network-online.target

  [Service]
  Type=simple
  User=freebox
  Group=freebox
  ExecStart=/home/freebox/melodie/melodie
  WorkingDirectory=/home/freebox/melodie
  Restart=on-failure
  TimeoutStopSec=30

  [Install]
  WantedBy=multi-user.target
  ```
- clean old syslog entries: `journalctl --vacuum-time=2d`