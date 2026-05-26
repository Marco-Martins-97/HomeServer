# Home Server v1.1

Personal home server running on a Raspberry Pi Zero 2W, accessible via browser on the local network.

## Features

- To-do list
- Shopping list
- Custom timers
- Recipes
- System status page (CPU, RAM, disk, temperature, network)
- Physical shutdown/restart buttons via GPIO

## Stack

- Node.js + Express
- SQLite (better-sqlite3)
- Vanilla HTML/CSS/JS
- Systemd (process manager)
- gpiozero (GPIO button handling)

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

## GPIO Buttons

| Button   | GPIO Pin | Physical Pin | Hold Time |
|----------|----------|--------------|-----------|
| Shutdown | GPIO 21  | Pin 40       | 3 seconds |
| Restart  | GPIO 20  | Pin 38       | 2 seconds |

Both buttons share GND on physical pin 39.

The button listener runs as a separate systemd service (`gpio-buttons.service`).

## Deployment

The server runs as a systemd service on the Pi, auto-starting on boot and restarting on crash.

To pull updates on the Pi:
```bash
cd /home/admin/homeserver
git pull
sudo systemctl restart homeserver
```

## System Configs

The `system-configs/` folder contains reference copies of system files:
- `homeserver.service` — systemd service definition
- `gpio-buttons.service` — systemd service for GPIO buttons