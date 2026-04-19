/**
 * صفحة تفسير الأبيات الشعرية — التعديلات:
 * 1. تنسيق الأبيات بشكلها الشعري (سطر لكل بيت)
 * 2. حذف خانة mood تحت البيت
 * 3. التفسير يظهر فوق البطاقات الثلاث
 * 4. حذف خانة keyWord
 * 5. زر توضيح أعمق فيه علامة + بدل السهم
 * 6. حذف خانة keyWord في الـ deep أيضاً
 * 7. رسالة الخطأ تظهر تحت زر "فسّر" مباشرة
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareText, Loader2, Music, Heart, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import PageNavButton from "@/components/PageNavButton";
import { useHistory } from "@/contexts/HistoryContext";
import { APIError, interpretVerses } from "@/services/api";

// ── Types ──────────────────────────────────────────────────────
interface VerseBreakdown { verse: string; meaning: string }

interface InterpretationResult {
  mainInterpretation: string;
  summary:            string;
  meter:              string;
  tone:               string;
  era:                string;
  depth:              string;
  versesBreakdown:    VerseBreakdown[];
  imagery:            string;
  meterEffect:        string;
}

interface InterpretationEntry {
  id:            string;
  title:         string;
  verse:         string;         // النص الأصلي كما أدخله المستخدم
  formattedVerse: string;        // النص مُنسَّق كأبيات شعرية
  result:        InterpretationResult;
}

// ── تنسيق النص كأبيات شعرية ──────────────────────────────────
function formatAsPoetry(raw: string): string {
  // إذا فيه سطور مفصولة بـ \n خليها كما هي
  // إذا كان نصاً مدموجاً، نحاول نقسمه على الوقفات الشعرية
  const lines = raw
    .replace(/\s*\/\s*/g, "\n")       // / تفصل بين الشطرين
    .replace(/\s{3,}/g, "\n")         // مسافات كثيرة = فاصل
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // إذا طلع سطر واحد فقط، نحاول نقسم على منتصف النص
  if (lines.length === 1 && lines[0].length > 20) {
    const mid = Math.floor(lines[0].length / 2);
    // ابحث عن أقرب مسافة للمنتصف
    let splitAt = mid;
    for (let i = mid; i >= mid - 10 && i > 0; i--) {
      if (lines[0][i] === " ") { splitAt = i; break; }
    }
    return lines[0].slice(0, splitAt).trim() + "\n" + lines[0].slice(splitAt).trim();
  }

  return lines.join("\n");
}

// ── API call ──────────────────────────────────────────────────
async function interpretVerse(
  verse: string,
  depth: "brief" | "deep" = "brief"
): Promise<InterpretationResult> {
  const response = await interpretVerses(verse, depth);

  // إذا الباك اند أرجع error (نص غير عربي أو غير شعري)
  if (!response.success) {
    throw new APIError(422, response.message ?? "تعذّر التفسير");
  }

  const d = response.data!;
  return {
    mainInterpretation: d.explanation,
    summary:            d.summary        ?? "",
    meter:              d.meter.arabic,
    tone:               d.topic.label,
    era:                d.era.label,
    depth:              d.depth          ?? depth,
    versesBreakdown:    d.verses_breakdown ?? [],
    imagery:            d.imagery        ?? "",
    meterEffect:        d.meter_effect   ?? "",
  };
}

const summarize = (text: string, max = 28) => {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max) + "…" : t;
};

// ── Branch Cards ───────────────────────────────────────────────
const branchCards = [
  { key: "meter" as const, label: "البحر الشعري",   icon: Music    },
  { key: "tone"  as const, label: "النوع والنبرة",   icon: Heart    },
  { key: "era"   as const, label: "العصر والتاريخ", icon: Calendar },
];

// ── مكوّن عرض التفسير ─────────────────────────────────────────
const InterpretDisplay = ({
  active,
  isDeepLoading,
  onDeep,
}: {
  active: InterpretationEntry;
  isDeepLoading: boolean;
  onDeep: () => void;
}) => {
  const r      = active.result;
  const isDeep = r.depth === "deep";
  const hasBreak = r.versesBreakdown && r.versesBreakdown.length > 0;

  return (
    <motion.div
      key={active.id + r.depth}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <OrnamentalDivider />

      {/* ── البيت مُنسَّق كأبيات شعرية ── */}
      <div className="max-w-2xl mx-auto mb-6 text-center">
        <p className="font-amiri text-lg text-brown-700/90 leading-loose whitespace-pre-line">
          {active.formattedVerse}
        </p>
      </div>

      {/* ── الملخص السريع ── */}
      {r.summary && (
        <div className="max-w-2xl mx-auto mb-5 p-4 rounded-2xl bg-brown-100/50 border border-brown-200/50 text-center">
          <p className="font-body text-sm text-brown-700 leading-relaxed">
            💡 {r.summary}
          </p>
        </div>
      )}

      {/* ── التفسير الرئيسي (فوق البطاقات) ── */}
      <div className="rounded-3xl p-7 max-w-2xl mx-auto mb-6 bg-brown-gradient text-primary-foreground glow-warm border border-brown-600/30">
        <h3 className="font-display text-lg mb-3 text-center">التفسير</h3>
        <p className="font-body leading-relaxed text-center text-primary-foreground/95 text-sm">
          {r.mainInterpretation}
        </p>
      </div>

      {/* ── البطاقات الثلاث (بعد التفسير) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6">
        {branchCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="glass-card-warm p-4 text-center"
          >
            <div className="w-8 h-8 rounded-full bg-brown-gradient mx-auto mb-2 flex items-center justify-center">
              <card.icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="font-kufi text-[10px] text-brown-500 mb-1">{card.label}</p>
            <p className="font-display text-sm text-brown-700">{active.result[card.key]}</p>
          </motion.div>
        ))}
      </div>

      {/* ── شرح بيت بيت (deep فقط) ── */}
      <AnimatePresence>
        {isDeep && hasBreak && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-2xl mx-auto mb-5 space-y-3 overflow-hidden"
          >
            <h4 className="font-kufi text-sm text-brown-700 text-center mb-2">شرح الأبيات</h4>
            {r.versesBreakdown.map((vb, i) => (
              <div key={i} className="glass-card-warm p-4 rounded-xl">
                <p className="font-amiri text-sm text-brown-700 leading-loose text-center mb-2 border-b border-brown-200/40 pb-2">
                  {vb.verse}
                </p>
                <p className="font-body text-xs text-brown-600/90 leading-relaxed text-center">
                  {vb.meaning}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── صورة بلاغية وأثر البحر (deep فقط، بدون keyWord) ── */}
      <AnimatePresence>
        {isDeep && (r.imagery || r.meterEffect) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {r.imagery && (
              <div className="glass-card-warm p-4 rounded-xl">
                <p className="font-kufi text-[10px] text-brown-500 mb-1">الصورة البلاغية</p>
                <p className="font-body text-xs text-brown-700 leading-relaxed">{r.imagery}</p>
              </div>
            )}
            {r.meterEffect && (
              <div className="glass-card-warm p-4 rounded-xl">
                <p className="font-kufi text-[10px] text-brown-500 mb-1">أثر البحر</p>
                <p className="font-body text-xs text-brown-700 leading-relaxed">{r.meterEffect}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── زر توضيح أعمق بعلامة + ── */}
      {!isDeep && (
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onDeep}
            disabled={isDeepLoading}
            className="font-ui border-brown-400/40 text-brown-700 hover:bg-brown-100/50 gap-2 rounded-full px-6"
          >
            {isDeepLoading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Plus className="h-3 w-3" />}
            {isDeepLoading ? "جارٍ التعمق..." : "توضيح أعمق"}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// =============================================================
const PoetryInterpretation = () => {
  const [input,          setInput]          = useState("");
  const [entries,        setEntries]        = useState<InterpretationEntry[]>([]);
  const [activeId,       setActiveId]       = useState<string | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isDeepLoading,  setIsDeepLoading]  = useState(false);
  const [inlineError,    setInlineError]    = useState<string | null>(null);
  const { addHistoryItem } = useHistory();
  const resultsRef         = useRef<HTMLDivElement>(null);

  const active = entries.find(e => e.id === activeId) ?? null;

  useEffect(() => {
    if (active) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeId]);

  // ── تفسير جديد ────────────────────────────────────────────
  const handleInterpret = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setInlineError(null);
    addHistoryItem("interpret", "تفسير الأبيات", input);
    try {
      const data  = await interpretVerse(input, "brief");
      const entry: InterpretationEntry = {
        id:             crypto.randomUUID(),
        title:          summarize(input),
        verse:          input,
        formattedVerse: formatAsPoetry(input),
        result:         data,
      };
      setEntries(prev => [entry, ...prev]);
      setActiveId(entry.id);
      setInput("");
    } catch (error) {
      // رسالة تظهر تحت الزر مباشرة
      const msg = error instanceof APIError
        ? error.message
        : "تعذّر تحليل الأبيات حالياً. حاول مرة أخرى.";
      setInlineError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── توضيح أعمق ────────────────────────────────────────────
  const handleDeep = async () => {
    if (!active) return;
    setIsDeepLoading(true);
    try {
      const data = await interpretVerse(active.verse, "deep");
      setEntries(prev =>
        prev.map(e => e.id === active.id
          ? { ...e, result: data }
          : e
        )
      );
    } catch (error) {
      const msg = error instanceof APIError ? error.message : "تعذّر التعمق حالياً.";
      setInlineError(msg);
    } finally {
      setIsDeepLoading(false);
    }
  };

  return (
    <PageLayout title="تفسير الأبيات الشعرية">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg letters={["ت", "ف", "س", "ي", "ر"]} count={18} opacity={0.06} />
        <div className="max-w-5xl mx-auto relative z-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <MessageSquareText className="h-10 w-10 text-brown-600 mx-auto mb-4" />
            <h2 className="font-display text-3xl text-gradient-brown mb-2">تفسير الأبيات الشعرية</h2>
            <p className="font-kufi text-brown-600">أدخل بيتاً شعرياً واحصل على شرح مبسّط وواضح</p>
          </motion.div>

          {/* الإدخال */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="glass-card-warm p-6">
              <Textarea
                value={input}
                onChange={e => { setInput(e.target.value); setInlineError(null); }}
                placeholder="اكتب بيتاً شعرياً هنا..."
                className="font-amiri text-lg min-h-[80px] bg-background/60 border-brown-300/40 focus:border-brown-500/60 text-center leading-loose"
              />
              <Button
                onClick={handleInterpret}
                disabled={!input.trim() || isLoading}
                className="mt-4 w-full font-ui bg-brown-gradient text-primary-foreground gap-2 rounded-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
                {isLoading ? "جارٍ التفسير..." : "فسّر الأبيات الشعرية"}
              </Button>

              {/* ── رسالة الخطأ تحت الزر مباشرة ── */}
              <AnimatePresence>
                {inlineError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-sm text-center font-body text-brown-600/80"
                  >
                    {inlineError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* سجل التفسيرات */}
          {entries.length > 0 && (
            <div className="max-w-3xl mx-auto mb-8">
              <h3 className="font-kufi text-sm text-brown-700 mb-3 text-center">سجل التفسيرات</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {entries.map(e => (
                  <button key={e.id} onClick={() => setActiveId(e.id)}
                    className={`text-xs font-ui px-4 py-2 rounded-full border transition-all ${
                      e.id === activeId
                        ? "bg-brown-gradient text-primary-foreground border-brown-600/40"
                        : "bg-card/60 text-brown-700 border-brown-300/40 hover:bg-brown-100/50"
                    }`}>
                    {e.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* النتائج */}
          <div ref={resultsRef} />
          {active && (
            <InterpretDisplay
              active={active}
              isDeepLoading={isDeepLoading}
              onDeep={handleDeep}
            />
          )}

          {!active && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <MessageSquareText className="h-16 w-16 text-brown-300 mx-auto mb-4" />
              <p className="font-body text-brown-500/70">أدخل بيتاً شعرياً لتبدأ التفسير</p>
            </motion.div>
          )}

          <div className="mt-12 flex justify-center">
            <PageNavButton to="/write" label="التالي: كتابة الأبيات الشعرية" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PoetryInterpretation;
