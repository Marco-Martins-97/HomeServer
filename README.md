# Home Server   v.1.0

Personal home server running on a Raspberry Pi Zero 2W, accessible via browser on the local network.

## Features
- To-do list
- Shopping list
- Custom timers
- Recipes

## Stack
- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla HTML/CSS/JS
- Systemd (process manager)

## Hardware
- Raspberry Pi Zero 2W
- 8GB SD card
- Raspberry Pi OS Lite 32-bit

## Network
Accessible on the local network at `http://192.168.43.222:3000`

## Installation

Clone the repository:
```bash
git clone https://github.com/marco-martins-97/homeserver.git
cd homeserver
```

Install dependencies:
```bash
npm install
```

Start the server:
```bash
node server.js
```

## Deployment

The server runs as a systemd service on the Pi, auto-starting on boot and restarting on crash.

To pull updates on the Pi:
```bash
cd /home/admin/homeserver
git pull
sudo systemctl restart homeserver
```