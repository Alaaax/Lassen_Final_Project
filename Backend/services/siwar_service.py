# =============================================================
# services/siwar_service.py
# معجم سوار — مع تطبيع التاء المربوطة والهاء
# =============================================================

import httpx
import re
import os
from dotenv import load_dotenv

load_dotenv()

SIWAR_API_KEY  = os.getenv("SIWAR_API_KEY")
SIWAR_BASE_URL = os.getenv("SIWAR_BASE_URL", "https://siwar.ksaa.gov.sa")
TIMEOUT        = 10.0

PREFERRED_LEXICONS = [
    "معجم الرياض للغة العربية المعاصرة",
    "القاموس المحيط",
    "المعجم الوسيط",
    "لسان العرب",
    "تاج العروس",
]


def _strip_tashkeel(text: str) -> str:
    return re.sub(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC]", "", text).strip()


def _is_arabic(text: str) -> bool:
    clean = _strip_tashkeel(text)
    return bool(re.compile(r"[\u0621-\u063A\u0641-\u064A]").search(clean))


def _normalize_ta_ha(word: str) -> str:
    """
    يوحّد التاء المربوطة والهاء في نهاية الكلمة.
    مثال: "عسجديه" → "عسجدية"
    هذا يساعد في البحث في المعاجم التي تخزن الكلمة بالتاء المربوطة.
    """
    clean = _strip_tashkeel(word)
    # إذا ينتهي بـ ه → حوّله لـ ة للبحث
    if clean.endswith("ه"):
        return clean[:-1] + "ة"
    return clean


def _get_search_variants(word: str) -> list[str]:
    """
    يولّد أشكالاً مختلفة للكلمة للبحث في سوار:
    1. الكلمة بعد تحويل ه → ة
    2. الكلمة الأصلية
    3. الكلمة بعد ة → ه (للعكس)
    4. بدون ال التعريف
    """
    base       = _strip_tashkeel(word)
    normalized = _normalize_ta_ha(base)

    variants = [normalized]  # الأولوية للمطبّعة

    # إضافة الأصلية إذا مختلفة
    if base != normalized:
        variants.append(base)

    # العكس: إذا ة → ه
    if normalized.endswith("ة"):
        variants.append(normalized[:-1] + "ه")

    # بدون ال التعريف
    for v in list(variants):
        if v.startswith("ال") and len(v) > 4:
            variants.append(v[2:])

    # إزالة المكررات مع الحفاظ على الترتيب
    seen = set()
    unique = []
    for v in variants:
        if v and v not in seen:
            seen.add(v)
            unique.append(v)

    return unique


def _parse_senses_response(data: list) -> dict:
    if not isinstance(data, list) or not data:
        return {}

    sorted_entries = sorted(
        data,
        key=lambda x: next(
            (i for i, lex in enumerate(PREFERRED_LEXICONS)
             if lex in x.get("lexiconName", "")),
            len(PREFERRED_LEXICONS)
        )
    )

    all_definitions = []

    for entry in sorted_entries:
        lexicon_name = entry.get("lexiconName", "")
        senses       = entry.get("senses", [])
        for sense in senses:
            if sense and len(sense.strip()) > 5:
                all_definitions.append({
                    "definition":  sense.strip(),
                    "source_dict": lexicon_name,
                    "root":        None,
                })

    if not all_definitions:
        return {}

    combined_parts = []
    for i, d in enumerate(all_definitions[:6]):
        combined_parts.append(f"{i+1}. [{d['source_dict']}] {d['definition']}")

    return {
        "definition":      "\n".join(combined_parts),
        "all_definitions": all_definitions,
        "root":            None,
    }


def _parse_search_response(data: list) -> dict:
    if not isinstance(data, list) or not data:
        return {}

    all_definitions = []

    for entry in data:
        lexicon_name = entry.get("lexiconName", "")
        root_raw     = entry.get("root", "")
        senses       = entry.get("senses", [])
        for sense in senses:
            defn = sense.get("definition", "") if isinstance(sense, dict) else str(sense)
            if defn and len(defn.strip()) > 5:
                all_definitions.append({
                    "definition":  defn.strip(),
                    "source_dict": lexicon_name,
                    "root":        root_raw or None,
                })

    if not all_definitions:
        return {}

    all_definitions.sort(
        key=lambda x: next(
            (i for i, lex in enumerate(PREFERRED_LEXICONS)
             if lex in x.get("source_dict", "")),
            len(PREFERRED_LEXICONS)
        )
    )

    combined_parts = []
    for i, d in enumerate(all_definitions[:6]):
        combined_parts.append(f"{i+1}. [{d['source_dict']}] {d['definition']}")

    root = next((d["root"] for d in all_definitions if d.get("root")), None)

    return {
        "definition":      "\n".join(combined_parts),
        "all_definitions": all_definitions,
        "root":            root,
    }


async def _search_siwar_single(client: httpx.AsyncClient, query: str, headers: dict) -> dict:
    """يبحث بكلمة واحدة ويرجع النتيجة."""
    # المحاولة 1: senses
    try:
        resp = await client.get(
            f"{SIWAR_BASE_URL}/api/v1/external/public/senses",
            headers=headers,
            params={"query": query, "limit": 10},
        )
        if resp.status_code == 200:
            result = _parse_senses_response(resp.json())
            if result.get("definition"):
                return result
    except Exception:
        pass

    # المحاولة 2: search
    try:
        resp2 = await client.get(
            f"{SIWAR_BASE_URL}/api/v1/external/public/search",
            headers=headers,
            params={"query": query, "limit": 10},
        )
        if resp2.status_code == 200:
            result2 = _parse_search_response(resp2.json())
            if result2.get("definition"):
                return result2
    except Exception:
        pass

    return {}


async def get_siwar_definition(word: str) -> dict:
    """
    يبحث عن الكلمة في معجم سوار.
    يجرب أشكالاً مختلفة للكلمة (تاء مربوطة / هاء / بدون ال).
    """
    NOT_FOUND = {
        "found":           False,
        "is_arabic":       True,
        "definition":      None,
        "all_definitions": [],
        "root":            None,
    }

    if not _is_arabic(word):
        return {**NOT_FOUND, "is_arabic": False}

    if not SIWAR_API_KEY:
        print("⚠️ SIWAR_API_KEY مفقود")
        return NOT_FOUND

    headers  = {"apikey": SIWAR_API_KEY, "Accept": "application/json"}
    variants = _get_search_variants(word)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for variant in variants:
            result = await _search_siwar_single(client, variant, headers)
            if result.get("definition"):
                print(f"✅ سوار وجد '{word}' (بحث: '{variant}')")
                return {"found": True, "is_arabic": True, **result}

    print(f"ℹ️ سوار ما وجد '{word}' — GPT يعتمد على معرفته")
    return NOT_FOUND






# # =============================================================
# # services/siwar_service.py
# # معجم سوار — بالـ endpoints الصحيحة
# # /api/v1/external/public/senses  ← المعاني (الأفضل)
# # /api/v1/external/public/search  ← البحث العام
# # =============================================================

# import httpx
# import re
# import os
# from dotenv import load_dotenv

# load_dotenv()

# SIWAR_API_KEY  = os.getenv("SIWAR_API_KEY")
# SIWAR_BASE_URL = "https://siwar.ksaa.gov.sa"
# TIMEOUT        = 10.0

# # ترتيب المعاجم من الأهم للأقل أهمية شعرياً
# PREFERRED_LEXICONS = [
#     "معجم الرياض للغة العربية المعاصرة",
#     "القاموس المحيط",
#     "المعجم الوسيط",
#     "لسان العرب",
#     "تاج العروس",
# ]


# def _strip_tashkeel(text: str) -> str:
#     return re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC]', '', text).strip()


# def _is_arabic(text: str) -> bool:
#     clean = _strip_tashkeel(text)
#     return bool(re.compile(r'[\u0621-\u063A\u0641-\u064A]').search(clean))


# def _parse_senses_response(data: list) -> dict:
#     """
#     يحلل رد /public/senses ويُرجع التعاريف مرتبة.
#     الرد شكله:
#     [
#       {"senses": ["تعريف1", "تعريف2"], "lemma": "أمل", "lexiconName": "القاموس المحيط"},
#       ...
#     ]
#     """
#     if not isinstance(data, list) or not data:
#         return {}

#     # ── نرتب بناءً على المعجم المفضل ─────────────────────────
#     sorted_entries = sorted(
#         data,
#         key=lambda x: next(
#             (i for i, lex in enumerate(PREFERRED_LEXICONS)
#              if lex in x.get("lexiconName", "")),
#             len(PREFERRED_LEXICONS)  # غير موجود في القائمة = آخر
#         )
#     )

#     all_definitions = []
#     root = None

#     for entry in sorted_entries:
#         lexicon_name = entry.get("lexiconName", "")
#         senses       = entry.get("senses", [])

#         for sense in senses:
#             if sense and len(sense.strip()) > 5:
#                 all_definitions.append({
#                     "definition":  sense.strip(),
#                     "source_dict": lexicon_name,
#                     "root":        None,
#                 })

#     if not all_definitions:
#         return {}

#     # دمج كل التعاريف في نص واحد للبرومت
#     combined_parts = []
#     for i, d in enumerate(all_definitions[:6]):  # أول 6 تعاريف
#         lexicon = d["source_dict"]
#         defn    = d["definition"]
#         combined_parts.append(f"{i+1}. [{lexicon}] {defn}")

#     combined = "\n".join(combined_parts)

#     return {
#         "definition":      combined,
#         "all_definitions": all_definitions,
#         "root":            root,
#     }


# def _parse_search_response(data: list) -> dict:
#     """
#     يحلل رد /public/search كـ fallback.
#     """
#     if not isinstance(data, list) or not data:
#         return {}

#     all_definitions = []

#     for entry in data:
#         lexicon_name = entry.get("lexiconName", "")
#         lemma        = entry.get("lemma", "")
#         root_raw     = entry.get("root", "")
#         senses       = entry.get("senses", [])

#         for sense in senses:
#             defn = sense.get("definition", "") if isinstance(sense, dict) else str(sense)
#             if defn and len(defn.strip()) > 5:
#                 all_definitions.append({
#                     "definition":  defn.strip(),
#                     "source_dict": lexicon_name,
#                     "root":        root_raw or None,
#                 })

#     if not all_definitions:
#         return {}

#     # ترتيب بناءً على المعجم المفضل
#     all_definitions.sort(
#         key=lambda x: next(
#             (i for i, lex in enumerate(PREFERRED_LEXICONS)
#              if lex in x.get("source_dict", "")),
#             len(PREFERRED_LEXICONS)
#         )
#     )

#     combined_parts = []
#     for i, d in enumerate(all_definitions[:6]):
#         lexicon = d["source_dict"]
#         defn    = d["definition"]
#         combined_parts.append(f"{i+1}. [{lexicon}] {defn}")

#     root = next((d["root"] for d in all_definitions if d.get("root")), None)

#     return {
#         "definition":      "\n".join(combined_parts),
#         "all_definitions": all_definitions,
#         "root":            root,
#     }


# async def get_siwar_definition(word: str) -> dict:
#     """
#     يبحث عن الكلمة في معجم سوار.

#     Returns:
#         {
#           "found": bool,
#           "is_arabic": bool,
#           "definition": str,         ← كل التعاريف مرتبة للبرومت
#           "all_definitions": list,
#           "root": str | None
#         }
#     """
#     NOT_FOUND = {
#         "found":           False,
#         "is_arabic":       True,
#         "definition":      None,
#         "all_definitions": [],
#         "root":            None,
#     }

#     if not _is_arabic(word):
#         return {**NOT_FOUND, "is_arabic": False}

#     if not SIWAR_API_KEY:
#         print("⚠️ SIWAR_API_KEY مفقود")
#         return NOT_FOUND

#     clean   = _strip_tashkeel(word)
#     headers = {"apikey": SIWAR_API_KEY, "Accept": "application/json"}

#     # ── المحاولة 1: senses (الأفضل — يرجع المعاني مباشرة) ────
#     try:
#         async with httpx.AsyncClient(timeout=TIMEOUT) as client:
#             resp = await client.get(
#                 f"{SIWAR_BASE_URL}/api/v1/external/public/senses",
#                 headers=headers,
#                 params={"query": clean, "limit": 10},
#             )

#         if resp.status_code == 200:
#             data   = resp.json()
#             result = _parse_senses_response(data)
#             if result.get("definition"):
#                 print(f"✅ سوار وجد '{word}' في senses")
#                 return {"found": True, "is_arabic": True, **result}

#     except httpx.TimeoutException:
#         print(f"⏱️ Siwar timeout (senses): {clean}")
#     except Exception as e:
#         print(f"❌ Siwar error (senses): {e}")

#     # ── المحاولة 2: search (fallback) ────────────────────────
#     try:
#         async with httpx.AsyncClient(timeout=TIMEOUT) as client:
#             resp2 = await client.get(
#                 f"{SIWAR_BASE_URL}/api/v1/external/public/search",
#                 headers=headers,
#                 params={"query": clean, "limit": 10},
#             )

#         if resp2.status_code == 200:
#             data2   = resp2.json()
#             result2 = _parse_search_response(data2)
#             if result2.get("definition"):
#                 print(f"✅ سوار وجد '{word}' في search")
#                 return {"found": True, "is_arabic": True, **result2}

#     except httpx.TimeoutException:
#         print(f"⏱️ Siwar timeout (search): {clean}")
#     except Exception as e:
#         print(f"❌ Siwar error (search): {e}")

#     print(f"ℹ️ سوار ما وجد '{word}' — GPT يعتمد على معرفته")
#     return NOT_FOUND









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


