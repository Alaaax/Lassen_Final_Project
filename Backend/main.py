# =============================================================
# main.py — FastAPI
# تشغيل: uvicorn main:app --reload --port 8000
# =============================================================

import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import (
    TreasuresRequest, TreasuresResponse, SiwarInfo,
    MeaningEntry, ExampleVerse,
    MoodRequest, MoodResponse, PoemEntry,
    JourneyRequest, JourneyResponse, JourneyEraPoem, JourneySummary,
    InterpretRequest, InterpretResponse, InterpretData,
    MeterInfo, EraInfo, TopicInfo, TopicRank, VerseBreakdown,
    WriteGenerateRequest, WriteGenerateResponse,
)

try:
    from services.siwar_service       import get_siwar_definition
    from services.ai_service          import explain_word, get_mood_response
    from services.verse_searcher      import search_verses_for_word
    from services.poetry_retriever    import get_poems_for_mood, get_db_stats
    from services.journey_service     import build_time_journey
    from services.fasserha_service    import fasserha_api_response
    from services.help_me_write_service import generate_poetry_response
except ModuleNotFoundError:
    try:
        from Backend.services.siwar_service       import get_siwar_definition
        from Backend.services.ai_service          import explain_word, get_mood_response
        from Backend.services.verse_searcher      import search_verses_for_word
        from Backend.services.poetry_retriever    import get_poems_for_mood, get_db_stats
        from Backend.services.journey_service     import build_time_journey
        from Backend.services.fasserha_service    import fasserha_api_response
        from Backend.services.help_me_write_service import generate_poetry_response
    except ModuleNotFoundError:
        from services.siwar_service       import get_siwar_definition
        from services.ai_service          import explain_word, get_mood_response
        from services.verse_searcher      import search_verses_for_word
        from services.poetry_retriever    import get_poems_for_mood, get_db_stats
        from services.journey_service     import build_time_journey
        from services.fasserha_service    import fasserha_api_response
        from services.help_me_write_service import generate_poetry_response

load_dotenv()

app = FastAPI(title="لَــسِــن API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "✅ يعمل"}


@app.get("/health")
async def health():
    return {
        "openai":   "✅" if os.getenv("OPENAI_API_KEY") else "❌ مفقود",
        "siwar":    "✅" if os.getenv("SIWAR_API_KEY")  else "❌ مفقود",
        "poems_db": get_db_stats(),
    }


# =============================================================
# 🔌 كنوز الكلمات — POST /api/treasures/explain
# =============================================================

@app.post("/api/treasures/explain", response_model=TreasuresResponse)
async def explain_arabic_word(req: TreasuresRequest):
    siwar, db_verses = await asyncio.gather(
        get_siwar_definition(req.word),
        asyncio.to_thread(search_verses_for_word, req.word, 3),
    )

    if not siwar.get("is_arabic", True):
        return TreasuresResponse(
            status     = "error",
            error_type = "not_arabic",
            message    = "الكلمة اللي كتبتها مو عربية! اكتب كلمة بالحروف العربية.",
        )

    try:
        gpt_result = await explain_word(
            word         = req.word,
            siwar_result = siwar,
            db_verses    = db_verses,
            verse        = req.verse,
            is_followup  = req.is_followup,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ GPT: {str(e)}")

    if gpt_result.get("status") == "error":
        return TreasuresResponse(
            status     = "error",
            error_type = gpt_result.get("error_type", "unknown_word"),
            message    = gpt_result.get("message", "تعذّر شرح هذه الكلمة"),
        )

    meanings = [
        MeaningEntry(
            title       = m.get("title", ""),
            explanation = m.get("explanation", ""),
            source      = m.get("source", "gpt"),
        )
        for m in gpt_result.get("meanings", [])
    ]

    example_verses = [
        ExampleVerse(
            verse  = v.get("verse", ""),
            poet   = v.get("poet", "مجهول"),
            source = v.get("source", "gpt"),
        )
        for v in gpt_result.get("example_verses", [])
    ]

    return TreasuresResponse(
        status          = "ok",
        word            = req.word,
        plural          = gpt_result.get("plural"),
        primary_meaning = gpt_result.get("primary_meaning", ""),
        meanings        = meanings,
        poetic_usage    = gpt_result.get("poetic_usage", ""),
        symbolism       = gpt_result.get("symbolism", ""),
        example_verses  = example_verses,
        simple_tip      = gpt_result.get("simple_tip", ""),
        confidence      = gpt_result.get("confidence", "medium"),
        siwar           = SiwarInfo(
            found      = siwar["found"],
            definition = siwar.get("definition"),
            root       = siwar.get("root"),
        ),
    )


# =============================================================
# 🔌 مزاج اليوم — POST /api/mood/poems
# =============================================================

@app.post("/api/mood/poems", response_model=MoodResponse)
async def mood_poems(req: MoodRequest):
    try:
        category, poems = get_poems_for_mood(req.user_input, count=20)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        result = await get_mood_response(
            user_input           = req.user_input,
            conversation_history = req.history,
            poems                = poems,
            category             = category,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ GPT: {str(e)}")

    response_type = result.get("response_type", "redirect")

    if response_type == "poems":
        poem_entries = [
            PoemEntry(
                verse       = p.get("verse", ""),
                poet        = p.get("poet", "مجهول"),
                explanation = p.get("explanation", ""),
            )
            for p in result.get("poems", [])
        ]
        return MoodResponse(
            response_type     = "poems",
            feeling_detected  = result.get("feeling_detected", ""),
            feeling_intensity = result.get("feeling_intensity", ""),
            category_used     = result.get("category_used", category),
            opening_line      = result.get("opening_line", ""),
            poems             = poem_entries,
            closing_line      = result.get("closing_line", ""),
        )

    elif response_type == "clarify":
        return MoodResponse(
            response_type        = "clarify",
            message              = result.get("message", ""),
            suggested_categories = result.get("suggested_categories", []),
        )

    elif response_type == "confirm":
        return MoodResponse(
            response_type  = "confirm",
            message        = result.get("message", ""),
            detected_theme = result.get("detected_theme", ""),
            category_guess = result.get("category_guess", ""),
        )

    else:
        return MoodResponse(
            response_type = "redirect",
            message       = result.get("message", ""),
        )


# =============================================================
# 🔌 ساعدني أكتب — POST /api/write/generate
# =============================================================

@app.post("/api/write/generate", response_model=WriteGenerateResponse)
async def generate_write_poetry(req: WriteGenerateRequest):
    try:
        payload = await asyncio.to_thread(
            generate_poetry_response,
            req.idea,
            req.meter_num,
            req.num_verses,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ توليد الأبيات: {str(e)}")

    if not payload.get("success"):
        raise HTTPException(status_code=422, detail=payload.get("message", "تعذر توليد الأبيات"))

    return WriteGenerateResponse(
        success   = True,
        meter     = payload.get("meter"),
        meter_num = req.meter_num,
        verses    = payload.get("verses", []),
        message   = payload.get("message"),
    )


# =============================================================
# 🔌 رحلة عبر الزمن — POST /api/journey/explore
# =============================================================

@app.post("/api/journey/explore", response_model=JourneyResponse)
async def explore_time_journey(req: JourneyRequest):
    try:
        payload = await build_time_journey(req.theme)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ رحلة عبر الزمن: {str(e)}")

    return JourneyResponse(
        status         = payload.get("status", "ok"),
        selected_theme = payload.get("selected_theme", req.theme),
        intro_line     = payload.get("intro_line", ""),
        eras=[
            JourneyEraPoem(
                era_key        = era.get("era_key", ""),
                era_label      = era.get("era_label", ""),
                poem_id        = era.get("poem_id"),
                poem_title     = era.get("poem_title"),
                poet_name      = era.get("poet_name"),
                poem_meter     = era.get("poem_meter"),
                poem_theme     = era.get("poem_theme"),
                verses         = era.get("verses", []),
                cinematic_note = era.get("cinematic_note", ""),
                fallback_used  = bool(era.get("fallback_used", False)),
            )
            for era in payload.get("eras", [])
        ],
        summary=JourneySummary(
            similarities    = payload.get("summary", {}).get("similarities", []),
            core_difference = payload.get("summary", {}).get("core_difference", ""),
            final_line      = payload.get("summary", {}).get("final_line", ""),
        ),
        warnings = payload.get("warnings", []),
    )


# =============================================================
# 🔌 فسّرها لي — POST /api/interpret/verses
# =============================================================

@app.post("/api/interpret/verses", response_model=InterpretResponse)
async def interpret_verses_api(req: InterpretRequest):
    try:
        payload = await asyncio.to_thread(fasserha_api_response, req.poem, req.depth)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ تفسير الأبيات: {str(e)}")

    # ── إذا GPT رفض النص (مو عربي / مو شعر / نص غير مفهوم) ──
    if not payload.get("success"):
        return InterpretResponse(
            success    = False,
            error_type = payload.get("error_type", "unknown"),
            message    = payload.get("message", "تعذّر التفسير"),
        )

    data       = payload.get("data", {})
    meter_data = data.get("meter", {})
    era_data   = data.get("era", {})
    topic_data = data.get("topic", {})

    return InterpretResponse(
        success = True,
        data    = InterpretData(
            meter = MeterInfo(
                arabic     = meter_data.get("arabic", "غير محدد"),
                english    = meter_data.get("english", "unknown"),
                confidence = float(meter_data.get("confidence", 0.0)),
            ),
            era = EraInfo(
                label          = era_data.get("label", "غير محدد"),
                classical_prob = float(era_data.get("classical_prob", 0.0)),
                modern_prob    = float(era_data.get("modern_prob", 0.0)),
            ),
            topic = TopicInfo(
                label      = topic_data.get("label", "غير محدد"),
                confidence = float(topic_data.get("confidence", 0.0)),
                top3       = [
                    TopicRank(label=t.get("label",""), prob=float(t.get("prob",0)))
                    for t in topic_data.get("top3", [])
                ],
            ),
            depth            = data.get("depth", req.depth),
            summary          = data.get("summary", ""),
            explanation      = data.get("explanation", ""),
            verses_breakdown = [
                VerseBreakdown(verse=v.get("verse",""), meaning=v.get("meaning",""))
                for v in data.get("verses_breakdown", [])
            ],
            imagery      = data.get("imagery", ""),
            meter_effect = data.get("meter_effect", ""),
            key_word     = data.get("key_word", ""),
            mood         = data.get("mood", ""),
        ),
    )