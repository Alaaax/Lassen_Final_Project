"""
خدمة ميزة "ساعدني أكتب" - جزء توليد الأبيات فقط.
مستخرجة من نوتبوك generating_using_gpt_only.ipynb
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI

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