# =============================================================
# services/siwar_service.py — معجم سوار
# =============================================================

import httpx
import re
import os
from dotenv import load_dotenv

load_dotenv()

SIWAR_API_KEY  = os.getenv("SIWAR_API_KEY")
SIWAR_BASE_URL = "https://siwar.ksaa.gov.sa/api"
TIMEOUT        = 8.0


def _strip_tashkeel(text: str) -> str:
    return re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670]', '', text).strip()


def _is_arabic(text: str) -> bool:
    return bool(re.compile(r'[\u0600-\u06FF]').search(text))


def _get_root(entry: dict):
    for key in ("root", "rootWord", "الجذر", "root_word"):
        if key in entry and entry[key]:
            return str(entry[key]).strip()
    return None


def _extract_poetic_definition(data) -> dict:
    """يستخرج التعريف مع أولوية للمعنى الشعري."""
    if isinstance(data, list):
        entries = data
    elif isinstance(data, dict):
        entries = []
        for key in ("results", "data", "items", "entries"):
            if key in data and data[key]:
                val = data[key]
                entries = val if isinstance(val, list) else [val]
                break
        if not entries:
            entries = [data]
    else:
        return {}

    poetic_keywords = ["شعر", "أدب", "مجاز", "استعار", "كناي", "بلاغ", "شاعر"]
    best = None
    fallback = None

    for entry in entries[:5]:
        if not isinstance(entry, dict):
            continue
        definition = None
        for key in ("definition", "meaning", "المعنى", "التعريف", "text"):
            if key in entry and entry[key]:
                definition = str(entry[key]).strip()
                break
        if not definition:
            continue
        if any(kw in definition for kw in poetic_keywords):
            best = {"definition": definition, "root": _get_root(entry)}
            break
        elif fallback is None:
            fallback = {"definition": definition, "root": _get_root(entry)}

    return best or fallback or {}


async def get_siwar_definition(word: str) -> dict:
    NOT_FOUND = {"found": False, "definition": None, "root": None, "is_arabic": True}

    if not _is_arabic(word):
        return {**NOT_FOUND, "is_arabic": False}

    if not SIWAR_API_KEY:
        return NOT_FOUND

    clean = _strip_tashkeel(word)
    headers = {"apikey": SIWAR_API_KEY, "Accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(
                f"{SIWAR_BASE_URL}/search",
                headers=headers,
                params={"query": clean, "limit": 5},
            )
        if resp.status_code == 200:
            entry = _extract_poetic_definition(resp.json())
            if entry.get("definition"):
                return {"found": True, "is_arabic": True, **entry}

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp2 = await client.get(
                f"{SIWAR_BASE_URL}/lookup",
                headers=headers,
                params={"word": clean},
            )
        if resp2.status_code == 200:
            entry = _extract_poetic_definition(resp2.json())
            if entry.get("definition"):
                return {"found": True, "is_arabic": True, **entry}

    except httpx.TimeoutException:
        print(f"⏱️ Siwar timeout: {clean}")
    except Exception as e:
        print(f"❌ Siwar error: {e}")

    return NOT_FOUND











# # =============================================================
# # services/siwar_service.py
# # التواصل مع معجم سوار - هيئة تطوير اللغة العربية
# # =============================================================

# import httpx
# import re
# import os
# from dotenv import load_dotenv

# load_dotenv()

# SIWAR_API_KEY  = os.getenv("SIWAR_API_KEY")
# SIWAR_BASE_URL = "https://siwar.ksaa.gov.sa/api"
# TIMEOUT        = 8.0


# def _strip_tashkeel(text: str) -> str:
#     return re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670]', '', text).strip()


# def _extract_entry(data) -> dict:
#     if isinstance(data, list):
#         if not data:
#             return {}
#         entry = data[0]
#     elif isinstance(data, dict):
#         for key in ("results", "data", "items", "entries"):
#             if key in data and data[key]:
#                 inner = data[key]
#                 entry = inner[0] if isinstance(inner, list) else inner
#                 break
#         else:
#             entry = data
#     else:
#         return {}

#     if not isinstance(entry, dict):
#         return {}

#     definition = None
#     for key in ("definition", "meaning", "المعنى", "التعريف", "text", "شرح", "desc"):
#         if key in entry and entry[key]:
#             definition = str(entry[key]).strip()
#             break

#     root = None
#     for key in ("root", "rootWord", "الجذر", "root_word"):
#         if key in entry and entry[key]:
#             root = str(entry[key]).strip()
#             break

#     return {"definition": definition, "root": root}


# async def get_siwar_definition(word: str) -> dict:
#     NOT_FOUND = {"found": False, "definition": None, "root": None}

#     if not SIWAR_API_KEY:
#         print("⚠️ SIWAR_API_KEY مفقود في .env")
#         return NOT_FOUND

#     clean_word = _strip_tashkeel(word)
#     headers = {
#         "apikey": SIWAR_API_KEY,
#         "Accept": "application/json",
#     }

#     try:
#         async with httpx.AsyncClient(timeout=TIMEOUT) as client:
#             resp = await client.get(
#                 f"{SIWAR_BASE_URL}/search",
#                 headers=headers,
#                 params={"query": clean_word, "limit": 1},
#             )

#         if resp.status_code == 200:
#             entry = _extract_entry(resp.json())
#             if entry.get("definition"):
#                 return {"found": True, **entry}

#         async with httpx.AsyncClient(timeout=TIMEOUT) as client:
#             resp2 = await client.get(
#                 f"{SIWAR_BASE_URL}/lookup",
#                 headers=headers,
#                 params={"word": clean_word},
#             )

#         if resp2.status_code == 200:
#             entry = _extract_entry(resp2.json())
#             if entry.get("definition"):
#                 return {"found": True, **entry}

#     except httpx.TimeoutException:
#         print(f"⏱️ Siwar timeout: {clean_word}")
#     except Exception as e:
#         print(f"❌ Siwar error: {e}")

#     return NOT_FOUND
