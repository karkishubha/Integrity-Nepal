from __future__ import annotations

import ast
import json
import re
from typing import Any
from urllib import error, request

from app.config import MAX_QUERY_CHARS, MAX_TEXT_CHARS, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.schemas import ComplaintStructure, QueryPlan
from app.services.geo import extract_department, normalize_region_name


CORRUPTION_PATTERNS = {
    "Bribery": ["bribe", "money", "commission", "speed money", "service fee", "demanding", "taking money"],
    "Delay": ["delay", "waiting", "waitlist", "late", "pending", "schedule an early hearing"],
    "Fraud": ["fake", "forged", "fake bills", "submitted", "pocketed", "diverted", "billing", "misuse"],
    "Abuse of Power": ["misuse", "influential", "wedding", "vehicle", "private", "power", "chairperson"],
}


def _truncate(value: str, limit: int) -> str:
    value = (value or "").strip()
    return value[:limit]


def _strip_code_fences(value: str) -> str:
    cleaned = value.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    return match.group(0) if match else cleaned


def safe_json_object(raw: str | None) -> dict[str, Any] | None:
    if not raw:
        return None
    cleaned = _strip_code_fences(raw)
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        try:
            parsed = ast.literal_eval(cleaned)
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None


def _remote_chat(messages: list[dict[str, str]]) -> str | None:
    if GROQ_API_KEY:
        return _groq_chat(messages)
    if OPENAI_API_KEY:
        return _openai_chat(messages)
        return None


def _groq_chat(messages: list[dict[str, str]]) -> str | None:
    body = json.dumps(
        {
            "model": GROQ_MODEL,
            "messages": messages,
            "temperature": 0,
        }
    ).encode("utf-8")
    req = request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"]
    except (error.URLError, KeyError, IndexError, json.JSONDecodeError, TimeoutError):
        return None


def _openai_chat(messages: list[dict[str, str]]) -> str | None:
    body = json.dumps(
        {
            "model": OPENAI_MODEL,
            "messages": messages,
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")
    req = request.Request(
        f"{OPENAI_BASE_URL}/chat/completions",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"]
    except (error.URLError, KeyError, IndexError, json.JSONDecodeError, TimeoutError):
        return None


def _determine_corruption_type(text: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in CORRUPTION_PATTERNS["Bribery"]):
        return "Bribery"
    if any(token in lowered for token in CORRUPTION_PATTERNS["Fraud"]):
        return "Fraud"
    if any(token in lowered for token in CORRUPTION_PATTERNS["Delay"]):
        return "Delay"
    if any(token in lowered for token in CORRUPTION_PATTERNS["Abuse of Power"]):
        return "Abuse of Power"
    return "Other"


def _determine_severity(text: str, corruption_type: str) -> str:
    lowered = text.lower()
    if any(token in lowered for token in ["lakhs", "million", "fake", "forged", "diverted", "pocketed"]):
        return "High"
    if corruption_type in {"Fraud", "Abuse of Power"}:
        return "High"
    if corruption_type in {"Bribery", "Delay"}:
        return "Medium"
    return "Low"


def _short_summary(text: str) -> str:
    sentence = re.split(r"(?<=[.!?])\s+", text.strip())[0]
    words = sentence.split()
    if len(words) <= 22:
        return sentence.strip()
    return " ".join(words[:22]).strip() + "..."


def heuristic_complaint_structure(text: str) -> ComplaintStructure:
    clipped = _truncate(text, MAX_TEXT_CHARS)
    corruption_type = _determine_corruption_type(clipped)
    region = normalize_region_name(clipped)
    department = extract_department(clipped)
    severity = _determine_severity(clipped, corruption_type)
    return ComplaintStructure(
        corruption_type=corruption_type,
        region=region,
        department=department,
        severity=severity,
        summary=_short_summary(clipped),
    )


def structure_complaint(text: str) -> ComplaintStructure:
    clipped = _truncate(text, MAX_TEXT_CHARS)
    raw = _remote_chat(
        [
            {
                "role": "system",
                "content": (
                    "You extract structured governance intelligence from complaint text. "
                    "Return JSON only with keys: corruption_type, region, department, severity, summary. "
                    "Use the allowed corruption_type values Bribery, Delay, Fraud, Abuse of Power, Other. "
                    "Use severity values Low, Medium, High. If uncertain, return null for region or department."
                ),
            },
            {"role": "user", "content": clipped},
        ]
    )
    parsed = safe_json_object(raw)
    if parsed:
        try:
            return ComplaintStructure.model_validate(parsed)
        except Exception:
            pass
    return heuristic_complaint_structure(clipped)


def _find_known_region(text: str) -> str | None:
    candidates = [
        "Koshi Province",
        "Madhesh Province",
        "Bagmati Province",
        "Gandaki Province",
        "Lumbini Province",
        "Karnali Province",
        "Sudurpashchim Province",
    ]
    lowered = text.lower()
    for region in candidates:
        if region.lower() in lowered:
            return region
    return normalize_region_name(text)


def heuristic_query_plan(query: str) -> QueryPlan:
    lowered = query.lower()
    filter_payload: dict[str, Any] = {}

    for corruption_type in ["Bribery", "Delay", "Fraud", "Abuse of Power"]:
        if corruption_type.lower() in lowered:
            filter_payload["corruption_type"] = corruption_type
            break

    region = _find_known_region(query)
    if region:
        filter_payload["region"] = region

    for department in ["Police", "Health", "Education", "Courts", "Local Government", "Land Administration", "Utilities", "Infrastructure", "Social Welfare"]:
        if department.lower() in lowered:
            filter_payload["department"] = department
            break

    aggregate_markers = ["most", "highest", "top", "rank", "count", "how many", "which region", "which department"]
    task = "aggregate" if any(marker in lowered for marker in aggregate_markers) else "list"

    group_by = None
    if "region" in lowered or "province" in lowered:
        group_by = "region"
    elif "department" in lowered or "office" in lowered:
        group_by = "department"
    elif "type" in lowered or "corruption" in lowered:
        group_by = "corruption_type"

    if task == "aggregate" and group_by is None:
        group_by = "region"

    return QueryPlan(task=task, filter=filter_payload, group_by=group_by, limit=10, sort_desc=True)


def interpret_query(query: str) -> QueryPlan:
    clipped = _truncate(query, MAX_QUERY_CHARS)
    raw = _remote_chat(
        [
            {
                "role": "system",
                "content": (
                    "Convert a governance analysis question into a JSON query plan. "
                    "Return JSON only with keys: task, filter, group_by, limit, sort_desc. "
                    "task must be aggregate or list. filter is an object. group_by may be region, department, corruption_type, severity, or null. "
                    "Never invent fields outside the schema."
                ),
            },
            {"role": "user", "content": clipped},
        ]
    )
    parsed = safe_json_object(raw)
    if parsed:
        try:
            plan = QueryPlan.model_validate(parsed)
            if plan.task not in {"aggregate", "list"}:
                raise ValueError("invalid task")
            return plan
        except Exception:
            pass
    return heuristic_query_plan(clipped)


def _extract_focus_region(plan: QueryPlan, grouped_rows: list[dict[str, Any]], matched: Any) -> str | None:
    if plan.group_by == "region" and grouped_rows:
        region = grouped_rows[0].get("region")
        return str(region) if region else None
    if "region" in plan.filter:
        return str(plan.filter["region"])
    if matched is not None:
        try:
            if not matched.empty and "region" in matched.columns:
                top_region = matched["region"].value_counts().idxmax()
                return str(top_region)
        except Exception:
            return None
    return None


def _default_query_answer(query_text: str, plan: QueryPlan, grouped_rows: list[dict[str, Any]], matched: Any) -> dict[str, str]:
    focus_region = _extract_focus_region(plan, grouped_rows, matched)
    corruption_type = str(plan.filter.get("corruption_type", "reported"))
    if plan.task == "aggregate" and plan.group_by == "region" and grouped_rows:
        top_row = grouped_rows[0]
        region = str(top_row.get("region", "the selected region"))
        count = int(top_row.get("count", 0))
        answer = f"{region} has the highest {corruption_type.lower()} cases with {count} complaints."
        visual_note = f"The visuals below are focused on {region}."
        return {"answer": answer, "visual_note": visual_note, "focus_region": focus_region or region}

    if plan.task == "list" and focus_region:
        answer = f"{corruption_type.capitalize()} cases in {focus_region} are listed below."
        visual_note = f"The visuals below highlight {focus_region}."
        return {"answer": answer, "visual_note": visual_note, "focus_region": focus_region}

    if grouped_rows and plan.group_by:
        top_row = grouped_rows[0]
        label = next((value for key, value in top_row.items() if key != "count"), "the selected group")
        count = int(top_row.get("count", 0))
        answer = f"{label} has the strongest signal in this result set with {count} cases."
        visual_note = "The visuals below follow the strongest matching region or category."
        return {"answer": answer, "visual_note": visual_note, "focus_region": focus_region}

    answer = f"I found {int(len(matched)) if matched is not None else 0} matching complaints for this query."
    visual_note = "The visuals below reflect the matching complaint set."
    return {"answer": answer, "visual_note": visual_note, "focus_region": focus_region}


def compose_query_response(query_text: str, plan: QueryPlan, matched: Any, grouped_rows: list[dict[str, Any]]) -> dict[str, str]:
    sample_cases: list[dict[str, Any]] = []
    try:
        if matched is not None and not matched.empty:
            sample_cases = matched.head(3)[["region", "department", "corruption_type", "severity", "summary"]].to_dict(orient="records")
    except Exception:
        sample_cases = []

    payload = {
        "query": query_text,
        "task": plan.task,
        "group_by": plan.group_by,
        "filters": plan.filter,
        "total_matches": int(len(matched)) if matched is not None else 0,
        "top_results": grouped_rows[:5],
        "sample_cases": sample_cases,
    }

    raw = _remote_chat(
        [
            {
                "role": "system",
                "content": (
                    "You write short civic intelligence answers from already aggregated complaint data. "
                    "Return JSON only with keys: answer, visual_note. "
                    "The answer should be one concise sentence that directly answers the user's question. "
                    "The visual_note should be one short sentence telling the user what the visuals below show. "
                    "Do not mention data processing or hidden reasoning. Do not invent facts beyond the provided summary."
                ),
            },
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ]
    )
    parsed = safe_json_object(raw)
    default_payload = _default_query_answer(query_text, plan, grouped_rows, matched)
    if parsed:
        answer = str(parsed.get("answer", "")).strip() or default_payload["answer"]
        visual_note = str(parsed.get("visual_note", "")).strip() or default_payload["visual_note"]
        return {
            "answer": answer,
            "visual_note": visual_note,
            "focus_region": default_payload["focus_region"],
        }

    if raw and raw.strip():
        return {
            "answer": raw.strip(),
            "visual_note": default_payload["visual_note"],
            "focus_region": default_payload["focus_region"],
        }

    return default_payload
