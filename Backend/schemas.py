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
    user_input: str        = Field(..., min_length=1, max_length=500)
    history:    list[dict] = Field(default=[])

class PoemEntry(BaseModel):
    verse:       str
    poet:        str
    explanation: str

class MoodResponse(BaseModel):
    response_type:        str
    feeling_detected:     Optional[str]  = None
    feeling_intensity:    Optional[str]  = None
    category_used:        Optional[str]  = None
    opening_line:         Optional[str]  = None
    poems:                list[PoemEntry] = []
    closing_line:         Optional[str]  = None
    message:              Optional[str]  = None
    suggested_categories: list[str]      = []
    detected_theme:       Optional[str]  = None
    category_guess:       Optional[str]  = None


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
    verses:         list[str]     = []
    cinematic_note: str
    fallback_used:  bool          = False

class JourneySummary(BaseModel):
    similarities:    list[str] = []
    core_difference: str       = ""
    final_line:      str       = ""

class JourneyResponse(BaseModel):
    status:         str = "ok"
    selected_theme: str
    intro_line:     str
    eras:           list[JourneyEraPoem]
    summary:        JourneySummary
    warnings:       list[str] = []


# ── فسرها لي (تفسير الأبيات) ──────────────────────────────────

class InterpretRequest(BaseModel):
    poem:  str = Field(..., min_length=2, max_length=5000)
    depth: str = Field(default="brief")   # "brief" | "deep"

class MeterInfo(BaseModel):
    arabic:     str
    english:    str
    confidence: float

class EraInfo(BaseModel):
    label:          str
    classical_prob: float
    modern_prob:    float

class TopicRank(BaseModel):
    label: str
    prob:  float

class TopicInfo(BaseModel):
    label:      str
    confidence: float
    top3:       list[TopicRank] = []

class VerseBreakdown(BaseModel):
    verse:   str
    meaning: str

class InterpretData(BaseModel):
    meter:            MeterInfo
    era:              EraInfo
    topic:            TopicInfo
    # حقول GPT
    depth:            str                  = "brief"
    summary:          str                  = ""
    explanation:      str                  = ""
    verses_breakdown: list[VerseBreakdown] = []
    imagery:          str                  = ""
    meter_effect:     str                  = ""
    key_word:         str                  = ""
    mood:             str                  = ""

class InterpretResponse(BaseModel):
    success:    bool
    data:       Optional[InterpretData] = None
    error_type: Optional[str]           = None
    message:    Optional[str]           = None


# ── ساعدني أكتب ────────────────────────────────────────────────

class WriteGenerateRequest(BaseModel):
    idea:       str = Field(..., min_length=2, max_length=500)
    meter_num:  int = Field(default=1, ge=1, le=16)
    num_verses: int = Field(default=4, ge=2, le=12)

class WriteGenerateResponse(BaseModel):
    success:   bool
    meter:     Optional[str] = None
    meter_num: Optional[int] = None
    verses:    list[str]     = []
    message:   Optional[str] = None