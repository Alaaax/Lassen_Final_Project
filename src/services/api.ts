// =============================================================
// src/services/api.ts
// =============================================================

const BASE = "https://lassen-final-project-occu.onrender.com";
export class APIError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new APIError(res.status, err.detail ?? `خطأ ${res.status}`);
  }
  return res.json();
}


// ── كنوز الكلمات ──────────────────────────────────────────────

export interface MeaningEntry  { title: string; explanation: string; source: "siwar" | "gpt" }
export interface ExampleVerse  { verse: string; poet: string; source: "database" | "gpt" }

export interface TreasuresResponse {
  status:           "ok" | "error";
  word?:            string;
  plural?:          string;
  primary_meaning?: string;
  meanings?:        MeaningEntry[];
  poetic_usage?:    string;
  symbolism?:       string;
  example_verses?:  ExampleVerse[];
  simple_tip?:      string;
  confidence?:      "high" | "medium" | "low";
  siwar?:           { found: boolean; definition: string | null; root: string | null };
  error_type?:      string;
  message?:         string;
}

export const explainWord = (word: string, verse?: string, is_followup = false) =>
  post<TreasuresResponse>("/api/treasures/explain", { word, verse, is_followup });


// ── مزاج اليوم ────────────────────────────────────────────────

export interface PoemEntry { verse: string; poet: string; explanation: string }

export interface MoodResponse {
  response_type:         "poems" | "clarify" | "redirect" | "confirm";
  feeling_detected?:     string;
  feeling_intensity?:    string;
  category_used?:        string;
  opening_line?:         string;
  poems?:                PoemEntry[];
  closing_line?:         string;
  message?:              string;
  suggested_categories?: string[];
  detected_theme?:       string;
  category_guess?:       string;
}

export interface MoodHistoryItem { role: "user" | "assistant"; content: string }

export const getMoodPoems = (user_input: string, history: MoodHistoryItem[] = []) =>
  post<MoodResponse>("/api/mood/poems", { user_input, history });


// ── ساعدني أكتب ───────────────────────────────────────────────

export interface WriteGenerateResponse {
  success:    boolean;
  meter?:     string;
  meter_num?: number;
  verses:     string[];
  message?:   string;
}

export const generateVerse = (idea: string, meter_num = 1, num_verses = 4) =>
  post<WriteGenerateResponse>("/api/write/generate", { idea, meter_num, num_verses });


// ── رحلة عبر الزمن ────────────────────────────────────────────

export interface JourneyEraPoem {
  era_key:        string;
  era_label:      string;
  poem_id?:       string;
  poem_title?:    string;
  poet_name?:     string;
  poem_meter?:    string;
  poem_theme?:    string;
  verses:         string[];
  cinematic_note: string;
  fallback_used:  boolean;
}

export interface JourneyResponse {
  status:         string;
  selected_theme: string;
  intro_line:     string;
  eras:           JourneyEraPoem[];
  summary: {
    similarities:    string[];
    core_difference: string;
    final_line:      string;
  };
  warnings: string[];
}

export const getTimeJourney = (theme: string) =>
  post<JourneyResponse>("/api/journey/explore", { theme });


// ── تفسير الأبيات ─────────────────────────────────────────────

export interface VerseBreakdown { verse: string; meaning: string }

export interface InterpretData {
  meter:            { arabic: string; english: string; confidence: number };
  era:              { label: string; classical_prob: number; modern_prob: number };
  topic:            { label: string; confidence: number; top3: { label: string; prob: number }[] };
  depth:            string;
  summary:          string;
  explanation:      string;
  verses_breakdown: VerseBreakdown[];
  imagery:          string;
  meter_effect:     string;
  key_word:         string;
  mood:             string;
}

export interface InterpretResponse {
  success:     boolean;
  data?:       InterpretData;
  error_type?: string;
  message?:    string;
}

export const interpretVerses = (verses: string, depth: "brief" | "deep" = "brief") =>
  post<InterpretResponse>("/api/interpret/verses", { poem: verses, depth });