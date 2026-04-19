"""
خدمة ميزة "فسرها لي" — تشغيل التصنيف عن بُعد عبر HF Space.
"""

from __future__ import annotations

import json
import os
from typing import Any

import requests
from dotenv import load_dotenv
from openai import OpenAI

from Fasserha_prompts import FASSERHA_SYSTEM_PROMPT, build_user_prompt

load_dotenv()


def _required_env(key: str) -> str:
    value = os.getenv(key, "").strip()
    if not value:
        raise RuntimeError(f"المتغير '{key}' غير موجود")
    return value


def _optional_env(key: str, default: str = "") -> str:
    return os.getenv(key, default).strip()


def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=_required_env("OPENAI_API_KEY"))


def _remote_classify(poem_text: str) -> dict[str, Any]:
    url = _required_env("FASSERHA_REMOTE_URL")
    api_key = _required_env("FASSERHA_REMOTE_API_KEY")
    timeout_sec = float(_optional_env("FASSERHA_REMOTE_TIMEOUT", "90"))

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }

    # إذا الـ Space خاص (Private)، أرسل Bearer token
    hf_bearer = _optional_env("HF_SPACE_BEARER_TOKEN")
    if hf_bearer:
        headers["Authorization"] = f"Bearer {hf_bearer}"

    try:
        resp = requests.post(
            url,
            headers=headers,
            json={"poem": poem_text},
            timeout=timeout_sec,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise RuntimeError(f"تعذر الاتصال بخدمة التصنيف الخارجية: {e}") from e
    except ValueError as e:
        raise RuntimeError("رد خدمة التصنيف ليس JSON صالح") from e

    for key in ("meter", "era", "topic"):
        if key not in data:
            raise RuntimeError(f"رد خدمة التصنيف ناقص: {key}")

    return data


def _count_verses(poem_text: str) -> int:
    lines = [l.strip() for l in poem_text.split("\n") if l.strip()]
    return max(1, len(lines))


def _calc_max_tokens(depth: str, verses_count: int) -> int:
    if depth == "brief":
        return 700
    return min(1000 + verses_count * 150, 3500)


def _safe_parse_json(raw: str, depth: str) -> dict[str, Any]:
    fallback = {
        "status": "ok",
        "depth": depth,
        "summary": "",
        "explanation": raw or "تعذّر استكمال التفسير.",
        "verses_breakdown": [],
        "imagery": "",
        "meter_effect": "",
        "mood": "",
    }
    if not raw:
        return fallback
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else fallback
    except json.JSONDecodeError:
        return fallback


def _generate_explanation(
    poem_text: str,
    meter_name: str,
    era_name: str,
    topic_name: str,
    depth: str = "brief",
) -> dict[str, Any]:
    user_prompt = build_user_prompt(
        poem_text=poem_text,
        meter_name=meter_name,
        era_name=era_name,
        topic_name=topic_name,
        depth=depth,
    )

    model_name = _optional_env("FASSERHA_LLM_MODEL", "gpt-4o")

    response = _get_openai_client().chat.completions.create(
        model=model_name,
        max_tokens=_calc_max_tokens(depth, _count_verses(poem_text)),
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FASSERHA_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw = (response.choices[0].message.content or "").strip()
    return _safe_parse_json(raw, depth)


def fasserha_li(poem_text: str, depth: str = "brief") -> dict[str, Any]:
    cls = _remote_classify(poem_text)

    meter_result = cls.get("meter", {})
    era_result = cls.get("era", {})
    topic_result = cls.get("topic", {})

    meter_name = meter_result.get("meter_ar", "غير محدد")
    era_name = era_result.get("era", "غير محدد")
    topic_name = topic_result.get("topic", "غير محدد")

    gpt = _generate_explanation(
        poem_text=poem_text,
        meter_name=meter_name,
        era_name=era_name,
        topic_name=topic_name,
        depth=depth,
    )

    return {
        "poem": poem_text,
        "meter": meter_result,
        "era": era_result,
        "topic": topic_result,
        "gpt": gpt,
    }


def fasserha_api_response(poem_text: str, depth: str = "brief") -> dict[str, Any]:
    if not poem_text or not poem_text.strip():
        return {
            "success": False,
            "error_type": "invalid_text",
            "message": "النص فارغ",
        }

    if depth not in ("brief", "deep"):
        depth = "brief"

    try:
        result = fasserha_li(poem_text, depth)
    except Exception as e:
        return {
            "success": False,
            "error_type": "classifier_unavailable",
            "message": str(e),
        }

    gpt = result["gpt"]

    if gpt.get("status") == "error":
        return {
            "success": False,
            "error_type": gpt.get("error_type", "unknown"),
            "message": gpt.get("message", "تعذّر التفسير"),
        }

    meter = result["meter"]
    era = result["era"]
    topic = result["topic"]

    return {
        "success": True,
        "data": {
            "meter": {
                "arabic": meter.get("meter_ar", "غير محدد"),
                "english": meter.get("meter_en", "unknown"),
                "confidence": float(meter.get("confidence", 0.0)),
            },
            "era": {
                "label": era.get("era", "غير محدد"),
                "classical_prob": float(era.get("classical_probability", 0.0)),
                "modern_prob": float(era.get("modern_probability", 0.0)),
            },
            "topic": {
                "label": topic.get("topic", "غير محدد"),
                "confidence": float(topic.get("confidence", 0.0)),
                "top3": topic.get("top3", []),
            },
            "depth": gpt.get("depth", depth),
            "summary": gpt.get("summary", ""),
            "explanation": gpt.get("explanation", ""),
            "verses_breakdown": gpt.get("verses_breakdown", []),
            "imagery": gpt.get("imagery", ""),
            "meter_effect": gpt.get("meter_effect", ""),
            "key_word": "",
            "mood": gpt.get("mood", ""),
        },
    }
