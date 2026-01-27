# Deployment & Operations

## Architecture

- **Server**: Ubuntu on AWS EC2
- **App server**: Uvicorn (ASGI) behind systemd
- **Frontend**: Vite (React) built to static files, served by Django
- **Database**: SQLite

## Management Script

The `charmefy` CLI is available system-wide via `/usr/local/bin/charmefy` (symlinked to `/home/ubuntu/charmefy/charmefy.sh`).

### Commands

| Command | Description |
|---------|-------------|
| `charmefy status` | Show service status |
| `charmefy start` | Start the service |
| `charmefy stop` | Stop the service |
| `charmefy restart` | Restart the service |
| `charmefy logs` | Tail live logs (`journalctl -f`). Ctrl+C to exit |
| `charmefy logs-all` | Show last 200 log lines |
| `charmefy deploy` | Full deploy: git pull, pip install, npm build, collectstatic, migrate, restart |
| `charmefy build` | Build frontend + collectstatic only |
| `charmefy migrate` | Run Django migrations only |

### Deploy Flow

`charmefy deploy` runs these steps in order. If any step fails, the script halts immediately (`set -euo pipefail`):

1. `git pull`
2. `pip install -r requirements.txt`
3. `cd frontend && npm install && npm run build`
4. `python manage.py collectstatic --noinput`
5. `python manage.py migrate --noinput`
6. `sudo systemctl restart charmefy`
7. Verify service is running (shows error logs if it failed)

**Important**: Commit or stash any local changes before running `deploy`, otherwise `git pull` may fail on conflicts.

## Systemd Service

Service file: `/etc/systemd/system/charmefy.service`

- Runs as `ubuntu` user
- Working directory: `/home/ubuntu/charmefy/backend`
- Loads env vars from `/home/ubuntu/charmefy/.env`
- Logs to journald with identifier `charmefy`
- Auto-restarts on failure (3 second delay)

### Manual systemd commands

```bash
sudo systemctl status charmefy
sudo systemctl restart charmefy
sudo journalctl -u charmefy -f
sudo journalctl -u charmefy -n 200 --no-pager
```

## Directory Structure

```
/home/ubuntu/charmefy/
  charmefy.sh          # Management script
  .env                 # Environment variables (not in git)
  requirements.txt     # Python dependencies
  backend/             # Django project
  frontend/            # Vite/React project
  env/                 # Python virtualenv
  docs/                # This documentation
```
