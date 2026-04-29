from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import API_ORIGINS, GEOJSON_PATH
from app.schemas import QueryRequest
from app.services.data_service import ComplaintRepository


app = FastAPI(title="Nepal Integrity Heatmap API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

repository = ComplaintRepository()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/summary")
def summary() -> dict:
    return repository.summary()


@app.get("/heatmap-data")
def heatmap_data() -> dict:
    return {"regions": repository.heatmap_data()}


@app.get("/cases/{region}")
def cases_by_region(region: str) -> dict:
    cases = repository.cases_for_region(region)
    return {"region": region, "cases": cases, "count": len(cases)}


@app.post("/query")
def query(request_body: QueryRequest) -> dict:
    if not request_body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return repository.query(request_body.query)


@app.get("/geojson/nepal-provinces")
def nepal_geojson() -> JSONResponse:
    if not GEOJSON_PATH.exists():
        raise HTTPException(status_code=404, detail="GeoJSON asset not found")
    return JSONResponse(content=json.loads(GEOJSON_PATH.read_text(encoding="utf-8")))
