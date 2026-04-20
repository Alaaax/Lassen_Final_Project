"""
خدمة ميزة "ساعدني أكتب" - جزء توليد الأبيات فقط.
مستخرجة من نوتبوك generating_using_gpt_only.ipynb
"""

from __future__ import annotations

import os
import re
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from supabase import Client, create_client

from HelpMeWrite_prompts import (
    HELP_WRITE_VALIDATE_SYSTEM_PROMPT,
    HELP_WRITE_VALIDATE_USER_PROMPT,
    HELP_WRITE_GENERATE_SYSTEM_PROMPT,
    HELP_WRITE_GENERATE_USER_PROMPT,
)

load_dotenv()

METERS = [
    "الطويل",
    "الكامل",
    "البسيط",
    "الوافر",
    "الخفيف",
    "الرجز",
    "الرمل",
    "السريع",
    "المنسرح",
    "الهزج",
    "المتقارب",
    "المتدارك",
    "المديد",
    "المضارع",
    "المقتضب",
    "المجتث",
]

METER_PATTERNS = {
    "الطويل": "فَعُولُنْ مَفَاعِيلُنْ فَعُولُنْ مَفَاعِلُنْ",
    "الكامل": "مُتَفَاعِلُنْ مُتَفَاعِلُنْ مُتَفَاعِلُنْ",
    "البسيط": "مُسْتَفْعِلُنْ فَاعِلُنْ مُسْتَفْعِلُنْ فَاعِلُنْ",
    "الوافر": "مُفَاعَلَتُنْ مُفَاعَلَتُنْ فَعُولُنْ",
    "الخفيف": "فَاعِلَاتُنْ مُسْتَفْعِلُنْ فَاعِلَاتُنْ",
    "الرجز": "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ",
    "الرمل": "فَاعِلَاتُنْ فَاعِلَاتُنْ فَاعِلَاتُنْ",
    "السريع": "مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مَفْعُولَاتُ",
    "المنسرح": "مُسْتَفْعِلُنْ مَفْعُولَاتُ مُسْتَفْعِلُنْ",
    "الهزج": "مَفَاعِيلُنْ مَفَاعِيلُنْ",
    "المتقارب": "فَعُولُنْ فَعُولُنْ فَعُولُنْ فَعُولُنْ",
    "المتدارك": "فَاعِلُنْ فَاعِلُنْ فَاعِلُنْ فَاعِلُنْ",
    "المديد": "فَاعِلَاتُنْ فَاعِلُنْ فَاعِلَاتُنْ",
    "المضارع": "مَفَاعِيلُنْ فَاعِلَاتُنْ",
    "المقتضب": "مَفْعُولَاتُ مُسْتَفْعِلُنْ",
    "المجتث": "مُسْتَفْعِلُنْ فَاعِلَاتُنْ",
}


@lru_cache(maxsize=1)
def _get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY غير موجود في .env")
    return OpenAI(api_key=api_key)


def _model_name() -> str:
    return os.getenv("HELP_WRITE_MODEL", "gpt-4o-mini")


ARABIC_DIACRITICS = re.compile(r"[\u064B-\u065F\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06ED]")
ARABIC_LETTERS = re.compile(r"[\u0600-\u06FF]")
MIN_ARABIC_CHARS = 3
MATCH_INPUT_DIACRITICS = re.compile(r"[\u064B-\u065F\u0670]")

EMBED_MODEL = os.getenv("WRITE_COMPLETE_EMBED_MODEL", "text-embedding-3-large")
EMBED_DIM = int(os.getenv("WRITE_COMPLETE_EMBED_DIM", "768"))
MATCH_THRESHOLD = float(os.getenv("WRITE_COMPLETE_MATCH_THRESHOLD", "0.87"))
LOOSE_MATCH_THRESHOLD = float(os.getenv("WRITE_COMPLETE_LOOSE_MATCH_THRESHOLD", "0.60"))
MIN_ALLOWED_SIMILARITY = float(os.getenv("WRITE_COMPLETE_MIN_SIMILARITY", "0.85"))
MATCH_COUNT = int(os.getenv("WRITE_COMPLETE_MATCH_COUNT", "24"))
TOP_K_CANDIDATES = int(os.getenv("WRITE_COMPLETE_TOP_K", "3"))
MAX_SEARCH_QUERIES = int(os.getenv("WRITE_COMPLETE_MAX_SEARCH_QUERIES", "4"))

RPC_MATCH_VERSES = os.getenv("WRITE_COMPLETE_RPC_MATCH", "match_verses")
RPC_GET_FULL_POEM = os.getenv("WRITE_COMPLETE_RPC_FULL_POEM", "get_full_poem")

COL_VERSE_DISPLAY = os.getenv("WRITE_COMPLETE_COL_VERSE", "verse")
COL_POEM_ID = os.getenv("WRITE_COMPLETE_COL_POEM_ID", "poem_id")
COL_POET = os.getenv("WRITE_COMPLETE_COL_POET", "poet_name")
COL_METER = os.getenv("WRITE_COMPLETE_COL_METER", "poem_meter")
COL_ERA = os.getenv("WRITE_COMPLETE_COL_ERA", "era")


@lru_cache(maxsize=1)
def _get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL أو SUPABASE_KEY غير موجود في .env")
    return create_client(supabase_url, supabase_key)


def strip_diacritics(text: str) -> str:
    return ARABIC_DIACRITICS.sub("", (text or "")).strip()


def normalize_for_matching(text: str) -> str:
    """
    نفس normalization المستخدم لبناء verse_normalized في قاعدة البيانات.
    """
    normalized = str(text or "")
    normalized = normalized.replace("ى", "ي")
    normalized = normalized.replace("ة", "ه")
    normalized = normalized.replace("إ", "ا")
    normalized = normalized.replace("أ", "ا")
    normalized = normalized.replace("آ", "ا")
    normalized = normalized.replace("ٱ", "ا")
    normalized = normalized.replace("ـ", "")
    normalized = MATCH_INPUT_DIACRITICS.sub("", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def _normalized_input_lines(text: str) -> set[str]:
    lines: set[str] = set()
    for raw_line in re.split(r"[\r\n]+", text or ""):
        cleaned = normalize_for_matching(raw_line)
        if cleaned:
            lines.add(cleaned)
    if lines:
        return lines
    one_line = normalize_for_matching(text)
    return {one_line} if one_line else set()


def _safe_text(value: Any, default: str) -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def validate_complete_input(text: str) -> tuple[bool, str]:
    if not text or not text.strip():
        return False, "الرجاء إدخال بيت شعر أو أكثر."

    if len(text) > 2000:
        return False, "النص طويل جدًا. الرجاء تقليل المدخل قليلًا."

    arabic_chars = ARABIC_LETTERS.findall(normalize_for_matching(text))
    if not arabic_chars:
        return False, "النص غير مفهوم. الرجاء إدخال بيت شعر عربي."

    if len(arabic_chars) < MIN_ARABIC_CHARS:
        return False, "النص قصير جدًا. الرجاء إدخال بيت شعر كامل."

    text_no_spaces = re.sub(r"\s+", "", text)
    if text_no_spaces and (len(arabic_chars) / len(text_no_spaces) < 0.4):
        return False, "النص غير مفهوم. الرجاء إدخال نص عربي واضح."

    return True, ""


def get_embedding(text: str) -> list[float]:
    response = _get_openai_client().embeddings.create(
        model=EMBED_MODEL,
        input=text,
        dimensions=EMBED_DIM,
    )
    return response.data[0].embedding


def _extract_unique_poem_candidates(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    best_by_poem: dict[str, dict[str, Any]] = {}
    for row in rows:
        poem_id_raw = row.get(COL_POEM_ID)
        poem_id = str(poem_id_raw).strip() if poem_id_raw is not None else ""
        if not poem_id:
            continue

        similarity_raw = row.get("similarity", 0)
        try:
            similarity = float(similarity_raw or 0)
        except (TypeError, ValueError):
            similarity = 0.0

        candidate = {
            "verse": _safe_text(row.get(COL_VERSE_DISPLAY), ""),
            "poem_id": poem_id,
            "poet": _safe_text(row.get(COL_POET), "مجهول"),
            "meter": _safe_text(row.get(COL_METER), "-"),
            "era": _safe_text(row.get(COL_ERA), "-"),
            "similarity": round(similarity, 4),
        }
        existing = best_by_poem.get(poem_id)
        if not existing or candidate["similarity"] > existing["similarity"]:
            best_by_poem[poem_id] = candidate

    return sorted(best_by_poem.values(), key=lambda item: item["similarity"], reverse=True)


def _split_search_queries(user_input: str) -> list[str]:
    """
    يدعم إدخال بيت/بيتين/نص أطول:
    - يجرّب النص كاملًا.
    - يجرّب كل سطر على حدة (حتى حد أقصى) لزيادة مرونة المطابقة.
    """
    normalized_full = normalize_for_matching(user_input)
    if not normalized_full:
        return []

    lines = [normalize_for_matching(line) for line in re.split(r"[\r\n]+", user_input or "")]
    lines = [line for line in lines if line]

    queries: list[str] = [normalized_full]
    for line in lines:
        if line not in queries:
            queries.append(line)
        if len(queries) >= max(1, MAX_SEARCH_QUERIES):
            break

    return queries


def _rpc_match_rows(query_text: str, match_count: int) -> list[dict[str, Any]]:
    query_embedding = get_embedding(query_text)
    response = _get_supabase_client().rpc(
        RPC_MATCH_VERSES,
        {"query_embedding": query_embedding, "match_count": match_count},
    ).execute()
    return response.data or []


def find_poem_candidates_in_db(verse: str, top_k: int = TOP_K_CANDIDATES) -> list[dict[str, Any]]:
    query_texts = _split_search_queries(verse)
    if not query_texts:
        return []

    all_rows: list[dict[str, Any]] = []
    match_count = max(MATCH_COUNT, top_k)
    for query_text in query_texts:
        all_rows.extend(_rpc_match_rows(query_text, match_count=match_count))

    if not all_rows:
        return []

    unique_poems = _extract_unique_poem_candidates(all_rows)
    if not unique_poems:
        return []

    min_similarity = max(0.0, min(1.0, MIN_ALLOWED_SIMILARITY))
    strict_threshold = max(MATCH_THRESHOLD, min_similarity)
    fallback_threshold = max(LOOSE_MATCH_THRESHOLD, min_similarity)

    strict = [item for item in unique_poems if item["similarity"] >= strict_threshold]
    if len(strict) >= top_k:
        return strict[:top_k]

    relaxed = [item for item in unique_poems if item["similarity"] >= fallback_threshold]
    return relaxed[:top_k]


def get_full_poem(poem_id: str) -> list[dict[str, Any]]:
    response = _get_supabase_client().rpc(
        RPC_GET_FULL_POEM,
        {"p_poem_id": str(poem_id)},
    ).execute()
    return response.data or []


def _build_poem_verses(poem_verses_rows: list[dict[str, Any]], input_lines: set[str]) -> list[dict[str, Any]]:
    poem_verses_rows_sorted = sorted(
        poem_verses_rows,
        key=lambda item: int(item.get("verse_index", 10**9)),
    )
    poem_verses: list[dict[str, Any]] = []
    for i, row in enumerate(poem_verses_rows_sorted, start=1):
        verse_text = (row.get("verse_text") or row.get("verse") or "").strip()
        if not verse_text:
            continue
        verse_index_raw = row.get("verse_index", i)
        try:
            verse_index = int(verse_index_raw)
        except Exception:
            verse_index = i

        verse_normalized = normalize_for_matching(verse_text)
        is_match = verse_normalized in input_lines
        if not is_match:
            is_match = any(
                verse_normalized and (verse_normalized in user_line or user_line in verse_normalized)
                for user_line in input_lines
            )

        poem_verses.append(
            {
                "verse_index": verse_index,
                "verse": verse_text,
                "is_input_match": is_match,
            }
        )
    return poem_verses


def help_me_write_complete_api_response(user_input: str) -> dict[str, Any]:
    is_valid, error_msg = validate_complete_input(user_input)
    if not is_valid:
        return {
            "success": False,
            "found": False,
            "poem_verses": [],
            "meta": {},
            "alternatives": [],
            "message": error_msg,
        }

    try:
        matched_candidates = find_poem_candidates_in_db(
            user_input.strip(),
            top_k=max(1, TOP_K_CANDIDATES),
        )
    except Exception as e:
        return {
            "success": False,
            "found": False,
            "poem_verses": [],
            "meta": {},
            "alternatives": [],
            "message": f"خطأ في البحث: {str(e)}",
        }

    if not matched_candidates:
        return {
            "success": True,
            "found": False,
            "poem_verses": [],
            "meta": {},
            "alternatives": [],
            "message": "هذا البيت غير موجود في قاعدة البيانات.",
        }

    input_lines = _normalized_input_lines(user_input.strip())
    alternatives: list[dict[str, Any]] = []
    warnings: list[str] = []

    for idx, matched_verse in enumerate(matched_candidates, start=1):
        try:
            poem_verses_rows = get_full_poem(matched_verse["poem_id"])
        except Exception as e:
            warnings.append(f"تعذّر جلب القصيدة رقم {idx}: {str(e)}")
            poem_verses_rows = []

        poem_verses = _build_poem_verses(poem_verses_rows, input_lines)
        if not poem_verses:
            poem_verses = [
                {
                    "verse_index": 1,
                    "verse": matched_verse["verse"],
                    "is_input_match": True,
                }
            ]

        alternatives.append(
            {
                "rank": idx,
                "poem_verses": poem_verses,
                "meta": {
                    "poet": matched_verse.get("poet") or "مجهول",
                    "meter": matched_verse.get("meter") or "-",
                    "era": matched_verse.get("era") or "-",
                    "similarity": float(matched_verse.get("similarity") or 0.0),
                },
                "matched_verse": matched_verse.get("verse"),
            }
        )

    if not alternatives:
        return {
            "success": True,
            "found": False,
            "poem_verses": [],
            "meta": {},
            "alternatives": [],
            "message": "تعذّر العثور على قصائد قريبة.",
        }

    primary = alternatives[0]

    return {
        "success": True,
        "found": True,
        "poem_verses": primary["poem_verses"],
        "meta": primary["meta"],
        "alternatives": alternatives,
        "current_index": 0,
        "total_candidates": len(alternatives),
        "message": " | ".join(warnings) if warnings else None,
    }


def validate_idea(idea_text: str) -> tuple[bool, str]:
    """
    تحقق ثنائي الطبقات:
    1) قواعد سريعة محلية
    2) تحقق دلالي عبر GPT (YES/NO)
    """
    idea_clean = (idea_text or "").strip()

    # layer 1 - local rules
    if not idea_clean:
        return False, "الرجاء كتابة فكرة للبدء."

    if len(idea_clean) < 3:
        return False, "الرجاء كتابة فكرة أوضح."

    arabic_chars = [c for c in idea_clean if "\u0600" <= c <= "\u06FF"]

    if len(arabic_chars) < 2:
        return False, "الرجاء كتابة فكرتك باللغة العربية."

    if len(arabic_chars) / max(1, len(idea_clean)) < 0.3:
        return False, "لم نفهم فكرتك — الرجاء كتابة جملة عربية واضحة."

    # layer 2 - semantic check with GPT
    response = _get_openai_client().chat.completions.create(
        model=_model_name(),
        messages=[
            {"role": "system", "content": HELP_WRITE_VALIDATE_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": HELP_WRITE_VALIDATE_USER_PROMPT.format(idea_text=idea_clean),
            },
        ],
        temperature=0,
        max_tokens=5,
    )

    answer = (response.choices[0].message.content or "").strip().upper()
    if "YES" not in answer:
        return False, "ما فهمنا فكرتك — الرجاء كتابة جملة واضحة."

    return True, idea_clean


def generate_verses(idea_text: str, meter_name: str, num_verses: int = 4) -> dict[str, Any]:
    """
    توليد أبيات شعرية بالفصحى على بحر محدد.
    """
    pattern = METER_PATTERNS.get(meter_name, "")
    pattern_line = f"Taf'ila pattern: {pattern}" if pattern else ""

    prompt = HELP_WRITE_GENERATE_USER_PROMPT.format(
        idea_text=idea_text,
        meter_name=meter_name,
        pattern_line=pattern_line,
        num_verses=num_verses,
    )

    response = _get_openai_client().chat.completions.create(
        model=_model_name(),
        messages=[
            {"role": "system", "content": HELP_WRITE_GENERATE_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.75,
    )

    raw_output = (response.choices[0].message.content or "").strip()
    verses = [
        line.strip()
        for line in raw_output.split("\n")
        if line.strip() and len(line.strip()) > 10
    ]

    return {
        "success": True,
        "verses": verses[:num_verses],
        "meter": meter_name,
    }


def help_me_write_generate_api_response(idea_text: str, meter_num: int = 1, num_verses: int = 4) -> dict[str, Any]:
    """
    الاستجابة الجاهزة للـ API لميزة ساعدني أكتب (توليد فقط).
    """
    if not 1 <= meter_num <= len(METERS):
        return {"success": False, "message": f"meter_num must be 1–{len(METERS)}"}

    meter_name = METERS[meter_num - 1]

    is_valid, result = validate_idea(idea_text)
    if not is_valid:
        return {"success": False, "message": result}

    generated = generate_verses(result, meter_name, num_verses)
    return {
        "success": True,
        "meter": generated["meter"],
        "verses": generated["verses"],
        "message": None,
    }


# اسم توافقي مختصر للاستخدام في main.py
def generate_poetry_response(idea: str, meter_num: int = 1, num_verses: int = 4) -> dict[str, Any]:
    return help_me_write_generate_api_response(
        idea_text=idea,
        meter_num=meter_num,
        num_verses=num_verses,
    )


def complete_poem_response(verse: str) -> dict[str, Any]:
    return help_me_write_complete_api_response(verse)