from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


CorruptionType = Literal["Bribery", "Delay", "Fraud", "Abuse of Power", "Other"]
Severity = Literal["Low", "Medium", "High"]
QueryTask = Literal["aggregate", "list"]


class ComplaintStructure(BaseModel):
    corruption_type: CorruptionType = "Other"
    region: str | None = None
    department: str | None = None
    severity: Severity = "Low"
    summary: str = ""


class QueryPlan(BaseModel):
    task: QueryTask = "list"
    filter: dict[str, Any] = Field(default_factory=dict)
    group_by: str | None = None
    limit: int = 10
    sort_desc: bool = True


class QueryRequest(BaseModel):
    query: str


class HeatmapRegion(BaseModel):
    region: str
    count: int
    intensity: str
