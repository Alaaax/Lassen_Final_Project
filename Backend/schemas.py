# =============================================================
# schemas.py
# =============================================================

from pydantic import BaseModel, Field
from typing import Optional


# ── كنوز الكلمات ──────────────────────────────────────────────

class TreasuresRequest(BaseModel):
    word:        str           = Field(..., min_length=1, max_length=60)
    verse:       Optional[str] = Field(default=None, max_length=300)
    is_followup: bool          = Field(default=False)

class SiwarInfo(BaseModel):
    found:      bool
    definition: Optional[str] = None
    root:       Optional[str] = None

class MeaningEntry(BaseModel):
    title:       str
    explanation: str
    source:      str = "gpt"

class ExampleVerse(BaseModel):
    verse:  str
    poet:   str
    source: str = "gpt"

class TreasuresResponse(BaseModel):
    status:          str
    word:            Optional[str]         = None
    plural:          Optional[str]         = None
    primary_meaning: Optional[str]         = None
    meanings:        list[MeaningEntry]    = []
    poetic_usage:    Optional[str]         = None
    symbolism:       Optional[str]         = None
    example_verses:  list[ExampleVerse]    = []
    simple_tip:      Optional[str]         = None
    confidence:      Optional[str]         = None
    siwar:           Optional[SiwarInfo]   = None
    error_type:      Optional[str]         = None
    message:         Optional[str]         = None


# ── مزاج اليوم ────────────────────────────────────────────────

class MoodRequest(BaseModel):
    user_input: str              = Field(..., min_length=1, max_length=500)
    history:    list[dict]       = Field(default=[])  # المحادثة السابقة


class PoemEntry(BaseModel):
    verse:       str
    poet:        str
    explanation: str


class MoodResponse(BaseModel):
    """
    response_type:
      "poems"    → عرض الأبيات
      "clarify"  → اسأل للتوضيح
      "redirect" → أعده للموضوع
      "confirm"  → تأكيد قبل العرض
    """
    response_type: str   # poems | clarify | redirect | confirm

    # ── حالة poems ────────────────────────────────────────────
    feeling_detected:  Optional[str]       = None
    feeling_intensity: Optional[str]       = None
    category_used:     Optional[str]       = None
    opening_line:      Optional[str]       = None
    poems:             list[PoemEntry]     = []
    closing_line:      Optional[str]       = None

    # ── حالة clarify / redirect / confirm ─────────────────────
    message:            Optional[str]      = None
    suggested_categories: list[str]        = []
    detected_theme:     Optional[str]      = None
    category_guess:     Optional[str]      = None


# ── رحلة عبر الزمن ────────────────────────────────────────────

class JourneyRequest(BaseModel):
    theme: str = Field(..., min_length=1, max_length=60)


class JourneyEraPoem(BaseModel):
    era_key:        str
    era_label:      str
    poem_id:        Optional[str] = None
    poem_title:     Optional[str] = None
    poet_name:      Optional[str] = None
    poem_meter:     Optional[str] = None
    poem_theme:     Optional[str] = None
    verses:         list[str] = []
    cinematic_note: str
    fallback_used:  bool = False


class JourneySummary(BaseModel):
    similarities:    list[str] = []
    core_difference: str = ""
    final_line:      str = ""


class JourneyResponse(BaseModel):
    status:         str = "ok"
    selected_theme: str
    intro_line:     str
    eras:           list[JourneyEraPoem]
    summary:        JourneySummary
    warnings:       list[str] = []


# ── TODO: باقي الصفحات ────────────────────────────────────────

# # =============================================================
# # schemas.py
# # =============================================================

# from pydantic import BaseModel, Field
# from typing import Optional


# # ── كنوز الكلمات ──────────────────────────────────────────────

# class TreasuresRequest(BaseModel):
#     word:        str           = Field(..., min_length=1, max_length=60)
#     verse:       Optional[str] = Field(default=None, max_length=300)
#     is_followup: bool          = Field(default=False)


# class SiwarInfo(BaseModel):
#     found:      bool
#     definition: Optional[str] = None
#     root:       Optional[str] = None


# class MeaningEntry(BaseModel):
#     title:       str
#     explanation: str
#     source:      str = "gpt"   # "siwar" أو "gpt"


# class ExampleVerse(BaseModel):
#     verse:  str
#     poet:   str
#     source: str = "gpt"        # "database" أو "gpt"


# class TreasuresResponse(BaseModel):
#     status:          str
#     # حالة ok
#     word:            Optional[str]         = None
#     plural:          Optional[str]         = None   # ← جمع الكلمة
#     primary_meaning: Optional[str]         = None
#     meanings:        list[MeaningEntry]    = []
#     poetic_usage:    Optional[str]         = None
#     symbolism:       Optional[str]         = None
#     example_verses:  list[ExampleVerse]    = []
#     simple_tip:      Optional[str]         = None
#     confidence:      Optional[str]         = None
#     siwar:           Optional[SiwarInfo]   = None
#     # حالة error
#     error_type:      Optional[str]         = None
#     message:         Optional[str]         = None


# # ── مزاج اليوم ────────────────────────────────────────────────

# class MoodRequest(BaseModel):
#     user_input: str = Field(..., min_length=1, max_length=500)


# class PoemEntry(BaseModel):
#     verse:       str
#     poet:        str
#     explanation: str


# class MoodResponse(BaseModel):
#     feeling_detected:  str
#     feeling_intensity: str
#     category_used:     str
#     opening_line:      str
#     poems:             list[PoemEntry]
#     closing_line:      str


# # TODO: WriteRequest / JourneyRequest / InterpretRequest


















# # يحدد شكل البيانات الداخلة والراجعة
# # مثل:
# # النص المدخل
# # الكلمة
# # البيت
# # الفكرة
# # يستخدم Pydantic


# # =============================================================
# # schemas.py
# # =============================================================

# from pydantic import BaseModel, Field
# from typing import Optional


# # ── كنوز الكلمات ──────────────────────────────────────────────

# class TreasuresRequest(BaseModel):
#     word:        str           = Field(..., min_length=1, max_length=60)
#     verse:       Optional[str] = Field(default=None, max_length=300)
#     is_followup: bool          = Field(default=False)

# class SiwarInfo(BaseModel):
#     found:      bool
#     definition: Optional[str] = None
#     root:       Optional[str] = None

# class TreasuresResponse(BaseModel):
#     word:          str
#     meaning:       str
#     poetic_usage:  str
#     symbolism:     str
#     example_verse: str
#     simple_tip:    str
#     confidence:    str
#     siwar:         SiwarInfo
#     verse:         Optional[str] = None


# # ── مزاج اليوم ────────────────────────────────────────────────

# class MoodRequest(BaseModel):
#     user_input: str = Field(..., min_length=1, max_length=500)

# class PoemEntry(BaseModel):
#     verse:       str
#     poet:        str
#     explanation: str

# class MoodResponse(BaseModel):
#     feeling_detected:  str
#     feeling_intensity: str
#     category_used:     str
#     opening_line:      str
#     poems:             list[PoemEntry]
#     closing_line:      str


# # ── TODO: باقي الصفحات ────────────────────────────────────────
# # WriteRequest / WriteResponse
# # JourneyRequest / JourneyResponse
# # InterpretRequest / InterpretResponse






















# # # =============================================================
# # # schemas.py — شكل البيانات (Request / Response)
# # # =============================================================

# # from pydantic import BaseModel, Field
# # from typing import Optional


# # # ── كنوز الكلمات ──────────────────────────────────────────────

# # class TreasuresRequest(BaseModel):
# #     word:       str           = Field(..., min_length=1, max_length=60)
# #     verse:      Optional[str] = Field(default=None, max_length=300)
# #     is_followup: bool         = Field(default=False)


# # class SiwarInfo(BaseModel):
# #     found:      bool
# #     definition: Optional[str] = None
# #     root:       Optional[str] = None


# # class TreasuresResponse(BaseModel):
# #     word:          str
# #     meaning:       str
# #     poetic_usage:  str
# #     symbolism:     str
# #     example_verse: str
# #     simple_tip:    str
# #     confidence:    str        # high | medium | low
# #     siwar:         SiwarInfo
# #     verse:         Optional[str] = None


# # # ── Schemas الصفحات الأخرى (لاحقاً) ──────────────────────────
# # # TODO: MoodRequest / MoodResponse
# # # TODO: WriteRequest / WriteResponse
# # # TODO: JourneyRequest / JourneyResponse
# # # TODO: InterpretRequest / InterpretResponse