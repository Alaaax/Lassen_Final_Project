// =============================================================
// src/services/api.ts
// =============================================================

const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

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
  status:          "ok" | "error";
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

export interface PoemEntry {
  verse: string; poet: string; explanation: string;
}

export interface MoodResponse {
  response_type: "poems" | "clarify" | "redirect" | "confirm";
  // poems
  feeling_detected?:     string;
  feeling_intensity?:    string;
  category_used?:        string;
  opening_line?:         string;
  poems?:                PoemEntry[];
  closing_line?:         string;
  // clarify / redirect / confirm
  message?:              string;
  suggested_categories?: string[];
  detected_theme?:       string;
  category_guess?:       string;
}

export interface MoodHistoryItem {
  role:    "user" | "assistant";
  content: string;
}

export const getMoodPoems = (user_input: string, history: MoodHistoryItem[] = []) =>
  post<MoodResponse>("/api/mood/poems", { user_input, history });

// TODO:
// export const generateVerse   = (idea: string)   => post("/api/write/generate",   { idea });
// export const getTimeJourney  = (topic: string)  => post("/api/journey/explore",  { topic });
// export const interpretVerses = (verses: string) => post("/api/interpret/verses", { verses });




// // =============================================================
// // src/services/api.ts
// // =============================================================

// const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// export class APIError extends Error {
//   constructor(public status: number, message: string) { super(message); }
// }

// async function post<T>(path: string, body: unknown): Promise<T> {
//   const res = await fetch(`${BASE}${path}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new APIError(res.status, err.detail ?? `خطأ ${res.status}`);
//   }
//   return res.json();
// }

// // ── كنوز الكلمات ──────────────────────────────────────────────

// export interface MeaningEntry {
//   title:       string;
//   explanation: string;
//   source:      "siwar" | "gpt";   // ← من وين المعنى
// }

// export interface ExampleVerse {
//   verse:  string;
//   poet:   string;
//   source: "database" | "gpt";     // ← من وين البيت
// }

// export interface TreasuresResponse {
//   status:          "ok" | "error";
//   // ok
//   word?:            string;
//   plural?:          string;        // ← جمع الكلمة
//   primary_meaning?: string;
//   meanings?:        MeaningEntry[];
//   poetic_usage?:    string;
//   symbolism?:       string;
//   example_verses?:  ExampleVerse[];
//   simple_tip?:      string;
//   confidence?:      "high" | "medium" | "low";
//   siwar?:           { found: boolean; definition: string | null; root: string | null };
//   // error
//   error_type?:      string;
//   message?:         string;
// }

// export const explainWord = (word: string, verse?: string, is_followup = false) =>
//   post<TreasuresResponse>("/api/treasures/explain", { word, verse, is_followup });


// // ── مزاج اليوم ────────────────────────────────────────────────

// export interface PoemEntry {
//   verse: string; poet: string; explanation: string;
// }

// export interface MoodResponse {
//   feeling_detected: string; feeling_intensity: string;
//   category_used: string; opening_line: string;
//   poems: PoemEntry[]; closing_line: string;
// }

// export const getMoodPoems = (user_input: string) =>
//   post<MoodResponse>("/api/mood/poems", { user_input });

// // TODO:
// // export const generateVerse   = (idea: string)   => post("/api/write/generate",   { idea });
// // export const getTimeJourney  = (topic: string)  => post("/api/journey/explore",  { topic });
// // export const interpretVerses = (verses: string) => post("/api/interpret/verses", { verses });

























// // هو حلقة الربط من الفرونت إلى الباك اند
// // بدل ما كل صفحة تكتب fetch لحالها
// // نخلي كل requests في مكان واحد


// // =============================================================
// // src/services/api.ts
// // =============================================================

// const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// export class APIError extends Error {
//   constructor(public status: number, message: string) { super(message); }
// }

// async function post<T>(path: string, body: unknown): Promise<T> {
//   const res = await fetch(`${BASE}${path}`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new APIError(res.status, err.detail ?? `خطأ ${res.status}`);
//   }
//   return res.json();
// }

// // ── كنوز الكلمات ──────────────────────────────────────────────

// export interface TreasuresResponse {
//   word: string; meaning: string; poetic_usage: string;
//   symbolism: string; example_verse: string; simple_tip: string;
//   confidence: "high" | "medium" | "low";
//   siwar: { found: boolean; definition: string | null; root: string | null };
//   verse: string | null;
// }

// export const explainWord = (word: string, verse?: string, is_followup = false) =>
//   post<TreasuresResponse>("/api/treasures/explain", { word, verse, is_followup });


// // ── مزاج اليوم ────────────────────────────────────────────────

// export interface PoemEntry {
//   verse: string;
//   poet: string;
//   explanation: string;
// }

// export interface MoodResponse {
//   feeling_detected:  string;
//   feeling_intensity: string;
//   category_used:     string;
//   opening_line:      string;
//   poems:             PoemEntry[];
//   closing_line:      string;
// }

// export const getMoodPoems = (user_input: string) =>
//   post<MoodResponse>("/api/mood/poems", { user_input });


// // TODO: باقي الصفحات
// // export const generateVerse   = (idea: string)   => post("/api/write/generate",   { idea });
// // export const getTimeJourney  = (topic: string)  => post("/api/journey/explore",  { topic });
// // export const interpretVerses = (verses: string) => post("/api/interpret/verses", { verses });




















// // // =============================================================
// // // src/services/api.ts — الاتصال بالباك اند
// // // =============================================================

// // const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// // export class APIError extends Error {
// //   constructor(public status: number, message: string) {
// //     super(message);
// //   }
// // }

// // async function post<T>(path: string, body: unknown): Promise<T> {
// //   const res = await fetch(`${BASE}${path}`, {
// //     method:  "POST",
// //     headers: { "Content-Type": "application/json" },
// //     body:    JSON.stringify(body),
// //   });
// //   if (!res.ok) {
// //     const err = await res.json().catch(() => ({}));
// //     throw new APIError(res.status, err.detail ?? `خطأ ${res.status}`);
// //   }
// //   return res.json();
// // }

// // // ── كنوز الكلمات ──────────────────────────────────────────────

// // export interface TreasuresResponse {
// //   word:          string;
// //   meaning:       string;
// //   poetic_usage:  string;
// //   symbolism:     string;
// //   example_verse: string;
// //   simple_tip:    string;
// //   confidence:    "high" | "medium" | "low";
// //   siwar: {
// //     found:      boolean;
// //     definition: string | null;
// //     root:       string | null;
// //   };
// //   verse: string | null;
// // }

// // export const explainWord = (word: string, verse?: string, is_followup = false) =>
// //   post<TreasuresResponse>("/api/treasures/explain", { word, verse, is_followup });

// // // مكان ربط باقي الصفحات لاحقاً:
// // // export const getMoodPoems   = (mood: string)   => post("/api/mood/poems", { mood });
// // // export const generateVerse  = (idea: string)   => post("/api/write/generate", { idea });
// // // export const getTimeJourney = (topic: string)  => post("/api/journey/explore", { topic });
// // // export const interpretVerses= (verses: string) => post("/api/interpret/verses", { verses });