from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from app.config import DATASET_PATH
from app.services.geo import PROVINCE_ORDER, province_intensity
from app.services.llm_service import compose_query_response, interpret_query, structure_complaint


def _empty_frame() -> pd.DataFrame:
    return pd.DataFrame(
        columns=[
            "complaint_text",
            "corruption_type",
            "region",
            "department",
            "severity",
            "summary",
        ]
    )


@dataclass
class ComplaintRepository:
    dataset_path: Path = DATASET_PATH

    def __post_init__(self) -> None:
        self._frame = _empty_frame()
        self.refresh()

    @property
    def frame(self) -> pd.DataFrame:
        return self._frame.copy()

    def refresh(self) -> None:
        if not self.dataset_path.exists():
            self._frame = _empty_frame()
            return

        raw_frame = pd.read_csv(self.dataset_path)
        if raw_frame.empty or "complaint_text" not in raw_frame.columns:
            self._frame = _empty_frame()
            return

        cleaned = raw_frame[["complaint_text"]].copy()
        cleaned["complaint_text"] = cleaned["complaint_text"].fillna("").astype(str).str.strip()
        cleaned = cleaned[cleaned["complaint_text"] != ""]

        if cleaned.empty:
            self._frame = _empty_frame()
            return

        structured_records = [structure_complaint(text).model_dump() for text in cleaned["complaint_text"].tolist()]
        structured_frame = pd.DataFrame(structured_records)
        self._frame = pd.concat([cleaned.reset_index(drop=True), structured_frame], axis=1)
        self._frame["region"] = self._frame["region"].fillna("Unknown").replace("", "Unknown")
        self._frame["department"] = self._frame["department"].fillna("Unknown").replace("", "Unknown")
        self._frame["corruption_type"] = self._frame["corruption_type"].fillna("Other")
        self._frame["severity"] = self._frame["severity"].fillna("Low")
        self._frame["summary"] = self._frame["summary"].fillna("")

    def summary(self) -> dict[str, Any]:
        frame = self._frame
        if frame.empty:
            return {
                "total_cases": 0,
                "distribution_overview": {
                    "by_corruption_type": [],
                    "by_region": [],
                    "by_department": [],
                    "by_severity": [],
                },
            }

        return {
            "total_cases": int(len(frame)),
            "distribution_overview": {
                "by_corruption_type": _series_count(frame, "corruption_type"),
                "by_region": _series_count(frame, "region"),
                "by_department": _series_count(frame, "department"),
                "by_severity": _series_count(frame, "severity"),
            },
        }

    def heatmap_data(self) -> list[dict[str, Any]]:
        if self._frame.empty:
            return [
                {"region": region, "count": 0, "intensity": "Low"}
                for region in PROVINCE_ORDER
            ]

        grouped = self._frame.groupby("region", dropna=False).size().reset_index(name="count")
        grouped = grouped[grouped["region"].isin(PROVINCE_ORDER)]
        counts = {row["region"]: int(row["count"]) for _, row in grouped.iterrows()}
        max_count = max(counts.values(), default=0)
        heatmap_rows = []
        for region in PROVINCE_ORDER:
            count = counts.get(region, 0)
            heatmap_rows.append({"region": region, "count": count, "intensity": province_intensity(count, max_count)})
        return heatmap_rows

    def cases_for_region(self, region: str) -> list[dict[str, Any]]:
        if self._frame.empty:
            return []
        region_clean = (region or "").strip()
        matched = self._frame[self._frame["region"].str.lower() == region_clean.lower()]
        return matched.to_dict(orient="records")

    def query(self, query_text: str) -> dict[str, Any]:
        plan = interpret_query(query_text)
        matched = self._apply_filter(self._frame, plan.filter)

        if plan.task == "aggregate" and plan.group_by:
            grouped = (
                matched.groupby(plan.group_by, dropna=False)
                .size()
                .reset_index(name="count")
                .sort_values(by="count", ascending=not plan.sort_desc)
            )
            records = grouped.head(plan.limit).to_dict(orient="records")
            narrative = compose_query_response(query_text, plan, matched, records)
            return {
                "query": query_text,
                "interpretation": plan.model_dump(),
                "results": records,
                "cases": matched.head(plan.limit).to_dict(orient="records"),
                "total_matches": int(len(matched)),
                "highlight_region": narrative["focus_region"],
                "answer": narrative["answer"],
                "visual_note": narrative["visual_note"],
            }

        narrative = compose_query_response(query_text, plan, matched, [])
        return {
            "query": query_text,
            "interpretation": plan.model_dump(),
            "results": [],
            "cases": matched.head(plan.limit).to_dict(orient="records"),
            "total_matches": int(len(matched)),
            "highlight_region": narrative["focus_region"],
            "answer": narrative["answer"],
            "visual_note": narrative["visual_note"],
        }

    def _apply_filter(self, frame: pd.DataFrame, filters: dict[str, Any]) -> pd.DataFrame:
        if frame.empty or not filters:
            return frame

        filtered = frame.copy()
        for key, value in filters.items():
            if value in (None, "", []):
                continue
            if key not in filtered.columns:
                continue
            filtered = filtered[filtered[key].fillna("").astype(str).str.lower() == str(value).lower()]
        return filtered


def _series_count(frame: pd.DataFrame, column_name: str) -> list[dict[str, Any]]:
    if frame.empty or column_name not in frame.columns:
        return []
    counts = frame[column_name].fillna("Unknown").astype(str).replace("", "Unknown").value_counts().reset_index()
    counts.columns = [column_name, "count"]
    return counts.to_dict(orient="records")
