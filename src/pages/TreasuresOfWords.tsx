/**
 * صفحة كنوز الكلمات
 * - جمع الكلمة تحت الاسم
 * - شارة "معجم سوار" فقط على المعاني المأخوذة من المعجم
 * - شارة "من قاعدة البيانات" على الأبيات الحقيقية
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Volume2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import PageNavButton from "@/components/PageNavButton";
import { useHistory } from "@/contexts/HistoryContext";
import {
  explainWord, TreasuresResponse, MeaningEntry, APIError
} from "@/services/api";

// ── مؤشر الثقة ────────────────────────────────────────────────
const ConfidenceBadge = ({ level }: { level: string }) => {
  const map: Record<string, { label: string; color: string }> = {
    high:   { label: "تأكيد عالٍ",   color: "text-emerald-500 border-emerald-500/30" },
    medium: { label: "تأكيد معقول", color: "text-amber-500  border-amber-500/30"   },
    low:    { label: "كلمة نادرة",   color: "text-rose-400   border-rose-400/30"    },
  };
  const { label, color } = map[level] ?? map.medium;
  return (
    <span className={`text-[10px] font-ui border rounded-full px-2 py-0.5 ${color}`}>
      {label}
    </span>
  );
};

// (تمت إزالة بطاقة البيت الشعري بناءً على طلب التصميم الجديد)

// ── بطاقة بيت شعري مثال ──────────────────────────────────────
const ExampleVerseCard = ({ verse }: { verse: { verse: string; poet: string; source: "database" | "gpt" } }) => (
  <div className="p-3 rounded-lg bg-brown-50/40 border border-brown-200/40 space-y-1.5">
    <p className="font-amiri text-sm text-brown-700 leading-loose text-center">
      {verse.verse}
    </p>
    <div className="flex items-center justify-between gap-2">
      {verse.poet && verse.poet !== "مجهول" && (
        <p className="font-ui text-[10px] text-brown-500/70">— {verse.poet}</p>
      )}
      {verse.source === "database" && (
        <span className="text-[9px] text-emerald-500/80 border border-emerald-400/20 rounded-full px-1.5 py-0.5 font-ui">
          من قاعدة البيانات
        </span>
      )}
    </div>
  </div>
);

// ── بطاقة معنى واحد ───────────────────────────────────────────
const MeaningCard = ({ meaning, index }: { meaning: MeaningEntry; index: number }) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-2">
      <p className="font-ui text-xs text-gold/70">{index + 1}. {meaning.title}</p>
      {/* شارة معجم سوار — فقط إذا المعنى من المعجم */}
      {meaning.source === "siwar" && (
        <span className="text-[9px] text-blue-400/70 border border-blue-400/20 rounded-full px-1.5 py-0.5 font-ui">
          معجم سوار
        </span>
      )}
    </div>
    <p className="font-body text-xs text-foreground/70 leading-relaxed pr-3">
      {meaning.explanation}
    </p>
  </div>
);

// ── أيقونة القلم ──────────────────────────────────────────────
const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

// =============================================================
interface WordEntry { id: string; data: TreasuresResponse }

const TreasuresOfWords = () => {
  const [input,       setInput]       = useState("");
  const [entries,     setEntries]     = useState<WordEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const { addHistoryItem } = useHistory();

  const handleSearch = async (followup = false) => {
    const word = followup ? entries[activeIndex]?.data.word! : input.trim();
    if (!word) return;
    setIsLoading(true);
    setError(null);
    if (!followup) addHistoryItem("treasures", "كنوز الكلمات", word);

    try {
      const result = await explainWord(word, undefined, followup);

      if (result.status === "error") {
        setError(result.message || "تعذّر شرح هذه الكلمة");
        return;
      }

      const entry: WordEntry = { id: `${word}-${Date.now()}`, data: result };

      if (followup) {
        setEntries(prev => prev.map((e, i) => i === activeIndex ? entry : e));
      } else {
        setEntries(prev => [entry, ...prev]);
        setActiveIndex(0);
        setInput("");
      }
    } catch (e) {
      setError(e instanceof APIError ? e.message : "تعذّر الاتصال بالسيرفر");
    } finally {
      setIsLoading(false);
    }
  };

  const active = entries[activeIndex];

  return (
    <PageLayout title="كنوز الكلمات">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />
        <div className="max-w-6xl mx-auto relative z-10">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <BookOpen className="h-10 w-10 text-brown-600 mx-auto mb-4" />
            <h2 className="font-display text-3xl text-gradient-brown mb-2">كنوز الكلمات</h2>
            <p className="font-kufi text-brown-600">
              اكتب كلمة لاكتشاف كنوزها ومعانيها
            </p>
          </motion.div>

          {/* ── حقل الإدخال ── */}
          <div className="max-w-lg mx-auto mb-4">
            <div className="relative glass-card p-2 flex items-center gap-2 glow-gold">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 pointer-events-none">
                <PenIcon />
              </div>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="مثال: عنقاء، النوى، سَلَوتُ..."
                className="font-display text-lg border-0 bg-transparent pr-10 focus-visible:ring-0"
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSearch()}
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 font-ui"
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />}
                اكتشف
              </Button>
            </div>

            {/* (تمت إزالة قسم البيت الاختياري بناءً على طلب التصميم) */}
          </div>

          {/* ── رسالة الخطأ ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-lg mx-auto mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── الكتاب المفتوح ── */}
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-5xl mx-auto"
              >
                {/* ── الصفحة اليمنى ── */}
                <div className="glass-card rounded-l-none md:rounded-r-2xl md:rounded-l-none p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-card to-secondary/30">

                  {/* زر الصوت */}
                  <Button
                    variant="ghost" size="icon"
                    className="text-gold hover:bg-gold/10 mb-3"
                    onClick={() => {
                      const u = new SpeechSynthesisUtterance(active.data.word || "");
                      u.lang = "ar-SA";
                      speechSynthesis.speak(u);
                    }}
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>

                  {/* الكلمة */}
                  <h3 className="font-display text-5xl md:text-6xl text-foreground mb-2">
                    {active.data.word}
                  </h3>

                  {/* ── الجمع ── */}
                  {active.data.plural && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-3"
                    >
                      <span className="text-xs font-ui text-muted-foreground/50 border border-gold/15 rounded-full px-3 py-1">
                        الجمع:{" "}
                        <span className="text-gold/80 font-display">{active.data.plural}</span>
                      </span>
                    </motion.div>
                  )}

                  {/* Badges */}
                  <div className="flex gap-2 mb-4 flex-wrap justify-center">
                    {active.data.confidence && <ConfidenceBadge level={active.data.confidence} />}
                  </div>

                  <div className="w-16 h-px bg-gold/40 mb-4" />

                  {/* simple_tip */}
                  {active.data.simple_tip && (
                    <p className="font-body text-xs text-gold/70 leading-relaxed mb-4 italic">
                      💡 {active.data.simple_tip}
                    </p>
                  )}

                  {/* (تمت إزالة قسم الأبيات الشعرية الأمثلة من هذه البطاقة) */}

                  {/* وضّح أكثر */}
                  <Button
                    variant="ghost" size="sm"
                    className="mt-5 text-xs text-muted-foreground/50 hover:text-gold gap-1"
                    onClick={() => handleSearch(true)} disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3" /> وضّح أكثر
                  </Button>
                </div>

                {/* ── الصفحة اليسرى ── */}
                <div className="glass-card rounded-r-none md:rounded-l-2xl md:rounded-r-none p-8 space-y-5 bg-gradient-to-bl from-card to-secondary/20">

                  {/* الشرح الرئيسي */}
                  {active.data.primary_meaning && (
                    <div className="p-3 rounded-lg bg-gold/5 border border-gold/15">
                      <p className="font-body text-sm text-foreground/90 leading-relaxed">
                        {active.data.primary_meaning}
                      </p>
                    </div>
                  )}

                  {/* ── أبرز 3 معاني مع شارة سوار ── */}
                  {active.data.meanings && active.data.meanings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-ui text-xs text-gold tracking-wider">أبرز المعاني</h4>
                      {active.data.meanings.map((m: MeaningEntry, i: number) => (
                        <MeaningCard key={i} meaning={m} index={i} />
                      ))}
                    </div>
                  )}

                  {/* الاستخدام الشعري */}
                  {active.data.poetic_usage && (
                    <div>
                      <h4 className="font-ui text-xs text-gold mb-1 tracking-wider">الاستخدام الشعري</h4>
                      <p className="font-body text-xs text-foreground/70 leading-relaxed">
                        {active.data.poetic_usage}
                      </p>
                    </div>
                  )}

                  {/* الرمزية */}
                  {active.data.symbolism && (
                    <div>
                      <h4 className="font-ui text-xs text-gold mb-1 tracking-wider">الرمزية والدلالة</h4>
                      <p className="font-body text-xs text-foreground/70 leading-relaxed">
                        {active.data.symbolism}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ── Empty State ── */
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <BookOpen className="h-20 w-20 text-brown-300 mx-auto mb-4" />
                <p className="font-body text-brown-600/70 mb-2">
                  اكتب كلمة لاكتشاف كنوزها ومعانيها
                </p>
                <p className="font-body text-xs text-muted-foreground/30">
                  مثال: عنقاء • النوى • سَلَوتُ • مَثولَةَ
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── الكلمات السابقة ── */}
          {entries.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {entries.map((e, i) => (
                <Button
                  key={e.id}
                  variant={i === activeIndex ? "default" : "outline"}
                  size="sm"
                  className={`font-display ${
                    i === activeIndex
                      ? "bg-primary text-primary-foreground"
                      : "border-gold/30 text-foreground/60 hover:bg-gold/10"
                  }`}
                  onClick={() => setActiveIndex(i)}
                >
                  {e.data.word}
                </Button>
              ))}
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
};

export default TreasuresOfWords;
