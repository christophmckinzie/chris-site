# chris-site

Resume, Weather On Route and the Geography Quiz in one Solid 2.0 app, with a small Flask API for the weather map.

```
web/   Vite + Solid 2.0 frontend  (pages: Resume "/", Weather "/weather-routing", Quiz "/quiz")
api/   Flask: POST /api/generate-weather-map, and serves web/dist in production
```

## Setup

Secrets are never committed (`.env*` and `*.local` are git-ignored). Create:

- `web/.env.local`: `VITE_MAPBOX_ACCESS_TOKEN=...` (quiz map)
- `api/.env`: `GMAPS_KEY=...` and `OWM_KEY=...` (weather map)

```
cd web && npm install
cd ../api && uv venv --python 3.15 && uv pip install -r requirements.txt
```

`uv` downloads Python 3.15 for `api/.venv` by itself, so no system Python install is needed. If `uv` is not on your PATH, use `python -m uv ...` instead. Activate the venv with `.venv\Scripts\Activate.ps1` (PowerShell) before `python app.py`.

## Develop

Two terminals:

```
cd api && python app.py        # API on http://localhost:5000
cd web && npm run dev          # site on http://localhost:5173 (proxies /api and /static to Flask)
```

Tests: `cd web && npm test`.

## Production

```
cd web && npm run build
cd ../api && gunicorn app:app   # serves the built site and the API from one process
```

Flask serves `web/dist`, and falls back to `index.html` for `/quiz` and `/weather-routing` so deep links and reloads work.

## Moving the old sites over

- The quiz used to live at quiz.chrisjonessoftware.com. Point that name at `/quiz` on this site with a redirect on the host.
- The influenza dashboard (Dash) and the PyQt weather app are not part of this repo.
