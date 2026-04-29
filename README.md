# Nepal Integrity Heatmap

AI-assisted civic intelligence dashboard for Nepal governance complaints.

## What it does

- Loads `nepal_governance_complaints_2026.csv` as the single source of truth.
- Structures each complaint into JSON fields for analytics and case viewing.
- Uses pandas for all counting, grouping, ranking, and filtering.
- Renders a province-level Nepal heatmap in React using a real Nepal ADM1 boundary layer.
- Accepts natural-language governance queries through the backend `/query` endpoint.

## Project layout

- `backend/` FastAPI service, LLM boundary, pandas analytics, GeoJSON endpoint.
- `frontend/` Vite React dashboard with the heatmap, metrics, and case list.
- `nepal_governance_complaints_2026.csv` complaint dataset.

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Optional environment variables:

- `OPENAI_API_KEY` enable remote JSON structuring and query interpretation.
- `OPENAI_BASE_URL` override the OpenAI-compatible endpoint.
- `OPENAI_MODEL` override the model name, default `gpt-4o-mini`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Optional environment variable:

- `VITE_API_BASE_URL` set this if the backend is not running on `http://127.0.0.1:8000`.

## API endpoints

- `GET /summary` total cases and distribution overview.
- `GET /heatmap-data` province counts and intensity labels.
- `POST /query` natural-language query interpretation plus matching cases.
- `GET /cases/{region}` case list for a selected province.
- `GET /geojson/nepal-provinces` GeoJSON used by the frontend map.

## Notes

- The LLM is only used for complaint structuring, query understanding, and wording explanations.
- All counting, grouping, and ranking stay in pandas.
- If the model returns invalid JSON or is unavailable, the backend falls back to deterministic heuristics.
