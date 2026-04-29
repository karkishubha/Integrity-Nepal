from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = BASE_DIR / "nepal_governance_complaints_2026.csv"
GEOJSON_PATH = Path(__file__).resolve().parent / "data" / "nepal_provinces.geojson"

load_dotenv(BASE_DIR / ".env", override=False)

API_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

MAX_TEXT_CHARS = int(os.getenv("MAX_TEXT_CHARS", "1200"))
MAX_QUERY_CHARS = int(os.getenv("MAX_QUERY_CHARS", "400"))
