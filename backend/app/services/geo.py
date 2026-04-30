from __future__ import annotations

import re


PROVINCE_ORDER = [
    "Koshi Province",
    "Madhesh Province",
    "Bagmati Province",
    "Gandaki Province",
    "Lumbini Province",
    "Karnali Province",
    "Sudurpashchim Province",
]

PROVINCE_ALIASES = {
    "province 1": "Koshi Province",
    "koshi": "Koshi Province",
    "sunsari": "Koshi Province",
    "morang": "Koshi Province",
    "morang district": "Koshi Province",
    "jhapa": "Koshi Province",
    "itahari": "Koshi Province",
    "biratnagar": "Koshi Province",
    "dharan": "Koshi Province",
    "madhesh": "Madhesh Province",
    "province 2": "Madhesh Province",
    "sarlahi": "Madhesh Province",
    "dhanusha": "Madhesh Province",
    "janakpur": "Madhesh Province",
    "siraha": "Madhesh Province",
    "rautahat": "Madhesh Province",
    "bara": "Madhesh Province",
    "parsa": "Madhesh Province",
    "bagmati": "Bagmati Province",
    "kathmandu": "Bagmati Province",
    "ktm": "Bagmati Province",
    "lalitpur": "Bagmati Province",
    "bhaktapur": "Bagmati Province",
    "nuwakot": "Bagmati Province",
    "dhading": "Bagmati Province",
    "chitwan": "Bagmati Province",
    "pokharkali": "Bagmati Province",
    "kavrepalanchok": "Bagmati Province",
    "sindhupalchok": "Bagmati Province",
    "gandaki": "Gandaki Province",
    "province 4": "Gandaki Province",
    "pokhara": "Gandaki Province",
    "kaski": "Gandaki Province",
    "tanahun": "Gandaki Province",
    "syangja": "Gandaki Province",
    "lamjung": "Gandaki Province",
    "mustang": "Gandaki Province",
    "gorkha": "Gandaki Province",
    "nawalpur": "Gandaki Province",
    "lumbini": "Lumbini Province",
    "province 5": "Lumbini Province",
    "butwal": "Lumbini Province",
    "rupandehi": "Lumbini Province",
    "banke": "Lumbini Province",
    "nepalgunj": "Lumbini Province",
    "kapilvastu": "Lumbini Province",
    "dang": "Lumbini Province",
    "gulmi": "Lumbini Province",
    "palpa": "Lumbini Province",
    "karnali": "Karnali Province",
    "province 6": "Karnali Province",
    "surkhet": "Karnali Province",
    "dailekh": "Karnali Province",
    "jumla": "Karnali Province",
    "salyan": "Karnali Province",
    "dolpa": "Karnali Province",
    "humla": "Karnali Province",
    "jajarkot": "Karnali Province",
    "sudurpashchim": "Sudurpashchim Province",
    "far west": "Sudurpashchim Province",
    "province 7": "Sudurpashchim Province",
    "doti": "Sudurpashchim Province",
    "dadeldhura": "Sudurpashchim Province",
    "kailali": "Sudurpashchim Province",
    "kanchanpur": "Sudurpashchim Province",
    "baitadi": "Sudurpashchim Province",
    "bajhang": "Sudurpashchim Province",
    "achham": "Sudurpashchim Province",
    "api": "Sudurpashchim Province",
}

DEPARTMENT_ALIASES = {
    "court": "Courts",
    "judge": "Courts",
    "court staff": "Courts",
    "police": "Police",
    "fir": "Police",
    "hospital": "Health",
    "health post": "Health",
    "medical": "Health",
    "school": "Education",
    "university": "Education",
    "professor": "Education",
    "municipality": "Local Government",
    "ward": "Local Government",
    "revenue office": "Land Administration",
    "malpot": "Land Administration",
    "electricity": "Utilities",
    "water": "Utilities",
    "drinking water": "Utilities",
    "road": "Infrastructure",
    "engineer": "Infrastructure",
    "social security": "Social Welfare",
}


def normalize_region_name(text: str | None) -> str | None:
    if not text:
        return None
    lowered = text.strip().lower()
    for alias, region in sorted(PROVINCE_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        if re.search(rf"\b{re.escape(alias)}\b", lowered):
            return region
    return None


def extract_department(text: str | None) -> str | None:
    if not text:
        return None
    lowered = text.lower()
    for alias, department in sorted(DEPARTMENT_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
        if alias in lowered:
            return department
    return None


def province_intensity(count: int, max_count: int) -> str:
    if count <= 0 or max_count <= 0:
        return "Low"
    ratio = count / max_count
    if ratio < 0.34:
        return "Low"
    if ratio < 0.67:
        return "Medium"
    return "High"
