"""
خدمة ميزة "فسرها لي" — نسخة مقاومة لانهيار الخادم.
"""

from __future__ import annotations

import html
import json
import os
import pickle
import re
from collections import Counter
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import torch
from dotenv import load_dotenv
from openai import OpenAI
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from Fasserha_prompts import FASSERHA_SYSTEM_PROMPT, FASSERHA_USER_PROMPT

load_dotenv()


ARABIC_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")

METER_LABELS = [
    "saree",
    "kamel",
    "mutakareb",
    "mutadarak",
    "munsareh",
    "madeed",
    "mujtath",
    "ramal",
    "baseet",
    "khafeef",
    "taweel",
    "wafer",
    "hazaj",
    "rajaz",
]

METER_ARABIC = {
    "saree": "السريع",
    "kamel": "الكامل",
    "mutakareb": "المتقارب",
    "mutadarak": "المتدارك",
    "munsareh": "المنسرح",
    "madeed": "المديد",
    "mujtath": "المجتث",
    "ramal": "الرمل",
    "baseet": "البسيط",
    "khafeef": "الخفيف",
    "taweel": "الطويل",
    "wafer": "الوافر",
    "hazaj": "الهزج",
    "rajaz": "الرجز",
}

TOPIC_AR = {
    "غزل_رومانسي": "غزل ورومانسية",
    "هجاء_ذم": "هجاء وذم",
    "وجداني": "عاطفة وحنين",
    "مدح": "مدح وإطراء",
    "رثاء": "رثاء وحزن",
    "دينية": "شعر ديني",
    "وطنية": "شعر وطني",
}


def _device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _model_device(model: Any) -> torch.device:
    for p in model.parameters():
        if not getattr(p, "is_meta", False):
            return p.device
    return torch.device("cpu")


def _get_env_path(primary_key: str, fallback_key: str | None = None) -> str:
    value = os.getenv(primary_key) or (os.getenv(fallback_key) if fallback_key else None)
    if not value:
        raise RuntimeError(f"المتغير '{primary_key}' غير موجود في .env")
    return value.strip()


def _available_memory_mb() -> float | None:
    try:
        with open("/proc/meminfo", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    kb = float(line.split()[1])
                    return kb / 1024.0
    except Exception:
        return None
    return None


def _should_disable_classifiers() -> bool:
    if os.getenv("FASSERHA_DISABLE_CLASSIFIERS", "0").strip() == "1":
        return True
    available_mb = _available_memory_mb()
    min_needed_mb = float(os.getenv("FASSERHA_MIN_MEMORY_MB", "3500"))
    return available_mb is not None and available_mb < min_needed_mb


@lru_cache(maxsize=1)
def _get_meter_assets():
    model_path = _get_env_path("FASSERHA_METER_MODEL_PATH")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.to(_device())
    model.eval()
    return tokenizer, model


@lru_cache(maxsize=1)
def _get_era_assets():
    model_path = _get_env_path("FASSERHA_ERA_MODEL_PATH")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.to(_device())
    model.eval()
    return tokenizer, model


@lru_cache(maxsize=1)
def _get_topic_assets():
    model_path = _get_env_path("FASSERHA_TOPIC_MODEL_PATH")
    labels_path = _get_env_path("FASSERHA_TOPIC_LABELS_PATH")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.to(_device())
    model.eval()

    with open(labels_path, "rb") as f:
        label_info = pickle.load(f)
    id2label = label_info["id2label"]
    return tokenizer, model, id2label


@lru_cache(maxsize=1)
def _get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY غير موجود في .env")
    return OpenAI(api_key=api_key)


def clean_arabic(text: str) -> str:
    if not text:
        return ""
    text = html.unescape(str(text))
    text = re.sub(r"<.*?>", " ", text)
    text = text.replace("\u0640", "")
    text = ARABIC_DIACRITICS.sub("", text)
    text = re.sub(r"[\u0623\u0625\u0622\u0671]", "\u0627", text)
    text = text.replace("\u0629", "\u0647")
    text = re.sub(r"[0-9\u0660-\u0669]", " ", text)
    text = re.sub(r"[^\u0600-\u06FF\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _default_meter() -> dict[str, Any]:
    return {"meter_ar": "غير محدد", "meter_en": "unknown", "confidence": 0.0}


def _default_era() -> dict[str, Any]:
    return {"era": "غير محدد", "classical_probability": 0.0, "modern_probability": 0.0}


def _default_topic() -> dict[str, Any]:
    return {"topic": "غير محدد", "confidence": 0.0, "top3": []}


def _safe_predict(fn, poem_text: str, fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        return fn(poem_text)
    except Exception:
        return fallback


def predict_meter(poem_text: str) -> dict[str, Any]:
    tokenizer, model = _get_meter_assets()
    verses = [v.replace("#", " ").strip() for v in poem_text.strip().split("\n") if v.strip()]
    if not verses:
        raise ValueError("النص الشعري فارغ")

    predictions = []
    model_dev = _model_device(model)
    max_len = int(getattr(model.config, "max_position_embeddings", 32))
    max_len = max(16, min(max_len, 128))

    for verse in verses:
        inputs = tokenizer(
            verse,
            return_tensors="pt",
            truncation=True,
            max_length=max_len,
            padding="max_length",
        )
        inputs = {k: v.to(model_dev) for k, v in inputs.items()}
        with torch.no_grad():
            probs = torch.softmax(model(**inputs).logits, dim=-1)[0]
        pred_id = int(torch.argmax(probs).item())
        confidence = float(probs[pred_id].item())
        predictions.append((METER_LABELS[pred_id], confidence))

    top_meter = Counter([p[0] for p in predictions]).most_common(1)[0][0]
    avg_conf = sum(c for _, c in predictions) / len(predictions)
    return {
        "meter_ar": METER_ARABIC.get(top_meter, top_meter),
        "meter_en": top_meter,
        "confidence": round(avg_conf, 3),
    }


def predict_era(poem_text: str) -> dict[str, Any]:
    tokenizer, model = _get_era_assets()
    cleaned = clean_arabic(poem_text)
    if not cleaned:
        raise ValueError("النص غير صالح للتحليل بعد التنظيف")

    encoded = tokenizer(
        cleaned,
        padding="max_length",
        truncation=True,
        max_length=256,
        return_tensors="pt",
    )
    model_dev = _model_device(model)
    encoded = {k: v.to(model_dev) for k, v in encoded.items()}
    with torch.no_grad():
        probs = torch.softmax(model(**encoded).logits, dim=-1).cpu().numpy()[0]

    label_names = ["قديم", "حديث"]
    pred_idx = int(np.argmax(probs))
    return {
        "era": label_names[pred_idx],
        "classical_probability": round(float(probs[0]), 4),
        "modern_probability": round(float(probs[1]), 4),
    }


def predict_topic(poem_text: str) -> dict[str, Any]:
    tokenizer, model, id2label_topic = _get_topic_assets()
    cleaned = clean_arabic(poem_text)
    if not cleaned:
        raise ValueError("النص غير صالح للتحليل بعد التنظيف")

    inputs = tokenizer(
        cleaned,
        truncation=True,
        max_length=512,
        return_tensors="pt",
        padding=True,
    )
    model_dev = _model_device(model)
    inputs = {k: v.to(model_dev) for k, v in inputs.items()}
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1)[0].cpu().numpy()
    top3 = np.argsort(probs)[::-1][:3]

    return {
        "topic": id2label_topic[int(top3[0])],
        "confidence": round(float(probs[top3[0]]), 3),
        "top3": [
            {"label": id2label_topic[int(i)], "prob": round(float(probs[i]), 3)}
            for i in top3
        ],
    }


def _build_user_prompt(poem_text: str, meter_name: str, era_name: str, topic_name: str, depth: str) -> str:
    detail_line = "مستوى التفصيل المطلوب: شرح مختصر." if depth == "brief" else "مستوى التفصيل المطلوب: شرح عميق."
    return (
        FASSERHA_USER_PROMPT.format(
            poem_text=poem_text,
            meter_name=meter_name,
            era_name=era_name,
            topic_name=topic_name,
        )
        + "\n\n"
        + detail_line
        + "\nأرجع JSON فقط بهذا الشكل: "
        + '{"status":"ok","depth":"brief|deep","summary":"...","explanation":"...","verses_breakdown":[{"verse":"...","meaning":"..."}],"imagery":"...","meter_effect":"...","mood":"..."}'
    )


def _count_verses(poem_text: str) -> int:
    lines = [l.strip() for l in poem_text.strip().split("\n") if l.strip()]
    return max(1, len(lines))


def _calc_max_tokens(depth: str, verses_count: int) -> int:
    if depth == "brief":
        return 600
    return min(800 + (verses_count * 140), 3000)


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
        if isinstance(parsed, dict):
            return parsed
        return fallback
    except json.JSONDecodeError:
        return fallback


def _generate_explanation(
    poem_text: str,
    meter_name: str,
    era_name: str,
    topic_name: str,
    depth: str = "brief",
) -> dict[str, Any]:
    user_prompt = _build_user_prompt(poem_text, meter_name, era_name, topic_name, depth)
    model_name = os.getenv("FASSERHA_LLM_MODEL", "gpt-4o")
    response = _get_openai_client().chat.completions.create(
        model=model_name,
        max_tokens=_calc_max_tokens(depth, _count_verses(poem_text)),
        temperature=0.5,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FASSERHA_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = (response.choices[0].message.content or "").strip()
    return _safe_parse_json(raw, depth)


def fasserha_li(poem_text: str, depth: str = "brief") -> dict[str, Any]:
    if _should_disable_classifiers():
        meter_result = _default_meter()
        era_result = _default_era()
        topic_result = _default_topic()
    else:
        meter_result = _safe_predict(predict_meter, poem_text, _default_meter())
        era_result = _safe_predict(predict_era, poem_text, _default_era())
        topic_result = _safe_predict(predict_topic, poem_text, _default_topic())

    meter_name = meter_result["meter_ar"]
    era_name = era_result["era"]
    topic_name = TOPIC_AR.get(topic_result["topic"], topic_result["topic"])
    gpt = _generate_explanation(poem_text, meter_name, era_name, topic_name, depth)

    return {
        "poem": poem_text,
        "meter": meter_result,
        "era": era_result,
        "topic": {**topic_result, "topic": topic_name},
        "gpt": gpt,
    }


def fasserha_api_response(poem_text: str, depth: str = "brief") -> dict[str, Any]:
    result = fasserha_li(poem_text, depth)
    gpt = result["gpt"]

    if gpt.get("status") == "error":
        return {
            "success": False,
            "error_type": gpt.get("error_type", "unknown"),
            "message": gpt.get("message", "تعذّر التفسير"),
        }

    return {
        "success": True,
        "data": {
            "meter": {
                "arabic": result["meter"]["meter_ar"],
                "english": result["meter"]["meter_en"],
                "confidence": result["meter"]["confidence"],
            },
            "era": {
                "label": result["era"]["era"],
                "classical_prob": result["era"]["classical_probability"],
                "modern_prob": result["era"]["modern_probability"],
            },
            "topic": {
                "label": result["topic"]["topic"],
                "confidence": result["topic"]["confidence"],
                "top3": result["topic"]["top3"],
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
