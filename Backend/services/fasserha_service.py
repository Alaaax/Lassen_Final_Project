"""
خدمة ميزة "فسرها لي" — محدّثة لدعم depth و JSON منظّم
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
from huggingface_hub import hf_hub_download
from openai import OpenAI
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from Fasserha_prompts import FASSERHA_SYSTEM_PROMPT, build_user_prompt

load_dotenv()

ARABIC_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")

METER_LABELS = [
    "saree", "kamel", "mutakareb", "mutadarak", "munsareh",
    "madeed", "mujtath", "ramal", "baseet", "khafeef",
    "taweel", "wafer", "hazaj", "rajaz",
]

METER_ARABIC = {
    "saree": "السريع", "kamel": "الكامل", "mutakareb": "المتقارب",
    "mutadarak": "المتدارك", "munsareh": "المنسرح", "madeed": "المديد",
    "mujtath": "المجتث", "ramal": "الرمل", "baseet": "البسيط",
    "khafeef": "الخفيف", "taweel": "الطويل", "wafer": "الوافر",
    "hazaj": "الهزج", "rajaz": "الرجز",
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

def _model_device(model) -> torch.device:
    for p in model.parameters():
        if not getattr(p, "is_meta", False):
            return p.device
    return torch.device("cpu")

def _get_env_required(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"المتغير '{key}' غير موجود في .env")
    return value.strip()

def _hf_token() -> str | None:
    token = os.getenv("HF_TOKEN")
    return token.strip() if token else None

def _is_local_path(path_or_repo: str) -> bool:
    return Path(path_or_repo).exists()

def _load_hf_or_local_assets(path_or_repo: str):
    token = _hf_token()
    common_kwargs = {"low_cpu_mem_usage": False}
    if _is_local_path(path_or_repo):
        tokenizer = AutoTokenizer.from_pretrained(path_or_repo)
        model = AutoModelForSequenceClassification.from_pretrained(path_or_repo, **common_kwargs)
    else:
        tokenizer = AutoTokenizer.from_pretrained(path_or_repo, token=token)
        model = AutoModelForSequenceClassification.from_pretrained(path_or_repo, token=token, **common_kwargs)
    model.eval()
    return tokenizer, model

def _resolve_labels_file(topic_model_path_or_repo: str, labels_ref: str) -> str:
    labels_ref = labels_ref.strip()
    if Path(labels_ref).is_file():
        return labels_ref
    if _is_local_path(topic_model_path_or_repo):
        local_candidate = Path(topic_model_path_or_repo) / labels_ref
        if local_candidate.is_file():
            return str(local_candidate)
    token = _hf_token()
    return hf_hub_download(repo_id=topic_model_path_or_repo, filename=labels_ref, repo_type="model", token=token)

@lru_cache(maxsize=1)
def _get_meter_assets():
    return _load_hf_or_local_assets(_get_env_required("FASSERHA_METER_MODEL_PATH"))

@lru_cache(maxsize=1)
def _get_era_assets():
    return _load_hf_or_local_assets(_get_env_required("FASSERHA_ERA_MODEL_PATH"))

@lru_cache(maxsize=1)
def _get_topic_assets():
    model_path = _get_env_required("FASSERHA_TOPIC_MODEL_PATH")
    labels_ref = _get_env_required("FASSERHA_TOPIC_LABELS_PATH")
    tokenizer, model = _load_hf_or_local_assets(model_path)
    labels_file = _resolve_labels_file(model_path, labels_ref)
    with open(labels_file, "rb") as f:
        label_info = pickle.load(f)
    return tokenizer, model, label_info["id2label"]

@lru_cache(maxsize=1)
def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=_get_env_required("OPENAI_API_KEY"))


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
    return re.sub(r"\s+", " ", text).strip()


def _topic_to_ar(label: str) -> str:
    return TOPIC_AR.get(label, label)


def predict_meter(poem_text: str) -> dict[str, Any]:
    tokenizer, model = _get_meter_assets()
    verses = [v.replace("#", " ").strip() for v in poem_text.strip().split("\n") if v.strip()]
    if not verses:
        raise ValueError("النص الشعري فارغ")
    predictions: list[tuple[str, float]] = []
    for verse in verses:
        seq_len = int(getattr(model.config, "max_position_embeddings", 32))
        inputs = tokenizer(verse, return_tensors="pt", truncation=True, max_length=seq_len, padding="max_length")
        model_dev = _model_device(model)
        inputs = {k: v.to(model_dev) for k, v in inputs.items()}
        with torch.no_grad():
            probs = torch.softmax(model(**inputs).logits, dim=-1)[0]
        pred_id = int(torch.argmax(probs).item())
        predictions.append((METER_LABELS[pred_id], float(probs[pred_id].item())))
    top_meter = Counter([m for m, _ in predictions]).most_common(1)[0][0]
    avg_conf = sum(c for _, c in predictions) / len(predictions)
    return {"meter_ar": METER_ARABIC.get(top_meter, top_meter), "meter_en": top_meter, "confidence": round(avg_conf, 3)}


def predict_era(poem_text: str) -> dict[str, Any]:
    tokenizer, model = _get_era_assets()
    cleaned = clean_arabic(poem_text)
    if not cleaned:
        raise ValueError("النص غير صالح للتحليل")
    encoded = tokenizer(cleaned, padding="max_length", truncation=True, max_length=256, return_tensors="pt")
    model_dev = _model_device(model)
    encoded = {k: v.to(model_dev) for k, v in encoded.items()}
    with torch.no_grad():
        probs = torch.softmax(model(**encoded).logits, dim=-1).cpu().numpy()[0]
    label_names = ["قديم", "حديث"]
    pred_idx = int(np.argmax(probs))
    return {"era": label_names[pred_idx], "classical_probability": round(float(probs[0]), 4), "modern_probability": round(float(probs[1]), 4)}


def predict_topic(poem_text: str) -> dict[str, Any]:
    tokenizer, model, id2label_topic = _get_topic_assets()
    cleaned = clean_arabic(poem_text)
    if not cleaned:
        raise ValueError("النص غير صالح للتحليل")
    inputs = tokenizer(cleaned, truncation=True, max_length=512, return_tensors="pt", padding=True)
    model_dev = _model_device(model)
    inputs = {k: v.to(model_dev) for k, v in inputs.items()}
    with torch.no_grad():
        probs = torch.softmax(model(**inputs).logits, dim=-1)[0].cpu().numpy()
    top3 = np.argsort(probs)[::-1][:3]
    top_label_raw = id2label_topic[int(top3[0])]
    return {
        "topic": _topic_to_ar(top_label_raw),
        "topic_raw": top_label_raw,
        "confidence": round(float(probs[top3[0]]), 3),
        "top3": [{"label": _topic_to_ar(id2label_topic[int(i)]), "prob": round(float(probs[i]), 3)} for i in top3],
    }


def _generate_explanation(
    poem_text: str,
    meter_name: str,
    era_name: str,
    topic_name: str,
    depth: str = "brief",
) -> dict[str, Any]:
    """
    يرسل للـ GPT ويُرجع dict منظّم.
    depth: "brief" | "deep"
    """
    user_prompt = build_user_prompt(poem_text, meter_name, era_name, topic_name, depth)
    model_name = os.getenv("FASSERHA_LLM_MODEL", "gpt-4o").strip()

    # حد الـ tokens حسب الـ depth
    max_tokens = 600 if depth == "brief" else 1200

    response = _get_openai_client().chat.completions.create(
        model=model_name,
        max_tokens=max_tokens,
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": FASSERHA_SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
    )

    raw = (response.choices[0].message.content or "").strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "status": "ok",
            "depth": depth,
            "summary": "",
            "explanation": raw,
            "key_word": "",
            "mood": "",
        }

    return result


def fasserha_li(poem_text: str, depth: str = "brief") -> dict[str, Any]:
    meter_result = predict_meter(poem_text)
    era_result   = predict_era(poem_text)
    topic_result = predict_topic(poem_text)

    gpt_result = _generate_explanation(
        poem_text=poem_text,
        meter_name=meter_result["meter_ar"],
        era_name=era_result["era"],
        topic_name=topic_result["topic"],
        depth=depth,
    )

    return {
        "poem":    poem_text,
        "meter":   meter_result,
        "era":     era_result,
        "topic":   topic_result,
        "gpt":     gpt_result,
    }


def fasserha_api_response(poem_text: str, depth: str = "brief") -> dict[str, Any]:
    result = fasserha_li(poem_text, depth)
    gpt    = result["gpt"]

    # إذا GPT أرجع خطأ (نص مو عربي أو مو شعر)
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
                "arabic":     result["meter"]["meter_ar"],
                "english":    result["meter"]["meter_en"],
                "confidence": result["meter"]["confidence"],
            },
            "era": {
                "label":          result["era"]["era"],
                "classical_prob": result["era"]["classical_probability"],
                "modern_prob":    result["era"]["modern_probability"],
            },
            "topic": {
                "label":      result["topic"]["topic"],
                "confidence": result["topic"]["confidence"],
                "top3":       result["topic"]["top3"],
            },
            # ── حقول GPT المنظّمة ──────────────────────────
            "depth":            gpt.get("depth", depth),
            "summary":          gpt.get("summary", ""),
            "explanation":      gpt.get("explanation", ""),
            "verses_breakdown": gpt.get("verses_breakdown", []),
            "imagery":          gpt.get("imagery", ""),
            "meter_effect":     gpt.get("meter_effect", ""),
            "key_word":         gpt.get("key_word", ""),
            "mood":             gpt.get("mood", ""),
        },
    }