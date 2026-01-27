# Charmefy

## Environment Detection

This project runs in two environments. Use the right approach for each:

### Production (Ubuntu server)

Use the `charmefy` management script for all operations. Do NOT run uvicorn directly.

```bash
charmefy status      # Check service
charmefy restart     # Restart app
charmefy logs        # Tail logs (Ctrl+C to exit)
charmefy deploy      # Git pull + full redeploy
charmefy build       # Build frontend + collectstatic
charmefy migrate     # Run Django migrations
```

See `docs/deployment.md` for full details.

### Local Development

1. **Build the frontend** (required before running Django):
   ```bash
   cd frontend && npm run build
   ```

2. **Start the Django backend**:
   ```bash
   cd backend && python -m uvicorn backend.asgi:application
   ```

### After Frontend Changes

Django serves the built frontend files. After making any frontend changes, you must rebuild:

```bash
cd frontend && npm run build
```

Then restart the Django server (locally) or run `charmefy restart` (production).

### Frontend Development (Optional)

For hot-reload during frontend development, run Vite dev server separately:

```bash
cd frontend && npm run dev
```

This runs at http://localhost:5173/static/
