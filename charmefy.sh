#!/usr/bin/env bash
set -euo pipefail

SERVICE="charmefy"
PROJECT_DIR="/home/ubuntu/charmefy"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV="$PROJECT_DIR/env/bin"

usage() {
    echo "Usage: charmefy <command>"
    echo ""
    echo "Commands:"
    echo "  status      Show service status"
    echo "  start       Start the service"
    echo "  stop        Stop the service"
    echo "  restart     Restart the service"
    echo "  logs        Tail live logs (Ctrl+C to exit)"
    echo "  logs-all    Show last 200 log lines"
    echo "  deploy      Full deploy: git pull + pip install + npm build + collectstatic + migrate + restart"
    echo "  build       Build frontend + collectstatic only"
    echo "  migrate     Run Django migrations only"
}

cmd_status() {
    sudo systemctl status "$SERVICE"
}

cmd_start() {
    sudo systemctl start "$SERVICE"
    echo "Service started."
}

cmd_stop() {
    sudo systemctl stop "$SERVICE"
    echo "Service stopped."
}

cmd_restart() {
    sudo systemctl restart "$SERVICE"
    echo "Service restarted."
}

cmd_logs() {
    sudo journalctl -u "$SERVICE" -f
}

cmd_logs_all() {
    sudo journalctl -u "$SERVICE" -n 200 --no-pager
}

cmd_build() {
    echo "==> Building frontend..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build

    echo "==> Collecting static files..."
    cd "$BACKEND_DIR"
    "$VENV/python" manage.py collectstatic --noinput

    echo "==> Build complete."
}

cmd_migrate() {
    echo "==> Running migrations..."
    cd "$BACKEND_DIR"
    "$VENV/python" manage.py migrate --noinput
    echo "==> Migrations complete."
}

cmd_deploy() {
    echo "==> Starting deploy..."

    echo "==> Pulling latest code..."
    cd "$PROJECT_DIR"
    git pull

    echo "==> Installing Python dependencies..."
    "$VENV/pip" install -r requirements.txt

    echo "==> Building frontend..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build

    echo "==> Collecting static files..."
    cd "$BACKEND_DIR"
    "$VENV/python" manage.py collectstatic --noinput

    echo "==> Running migrations..."
    "$VENV/python" manage.py migrate --noinput

    echo "==> Restarting service..."
    sudo systemctl restart "$SERVICE"

    sleep 2

    if sudo systemctl is-active --quiet "$SERVICE"; then
        echo "==> Deploy complete. Service is running."
    else
        echo "==> WARNING: Service failed to start! Recent logs:"
        sudo journalctl -u "$SERVICE" -n 20 --no-pager
        exit 1
    fi
}

if [[ $# -eq 0 ]]; then
    usage
    exit 1
fi

case "$1" in
    status)    cmd_status ;;
    start)     cmd_start ;;
    stop)      cmd_stop ;;
    restart)   cmd_restart ;;
    logs)      cmd_logs ;;
    logs-all)  cmd_logs_all ;;
    deploy)    cmd_deploy ;;
    build)     cmd_build ;;
    migrate)   cmd_migrate ;;
    *)
        echo "Unknown command: $1"
        usage
        exit 1
        ;;
esac
