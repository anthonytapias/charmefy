# Charmefy

## Development Setup

### Running the Application

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

Then restart the Django server.

### Frontend Development (Optional)

For hot-reload during frontend development, run Vite dev server separately:

```bash
cd frontend && npm run dev
```

This runs at http://localhost:5173/static/
