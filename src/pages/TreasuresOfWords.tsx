/**
 * صفحة كنوز الكلمات - مربوطة بالباك اند
 * ─────────────────────────────────────────
 * الدالة الوحيدة التي تتصل بالباك اند هي: explainWord من api.ts
 * كل شيء ثاني هو UI فقط
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Volume2, Loader2, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import { useHistory } from "@/contexts/HistoryContext";
import { explainWord, TreasuresResponse, APIError } from "@/services/api";

// ── نوع البطاقة المخزّنة محلياً ────────────────────────────────
interface WordEntry extends TreasuresResponse {
  id: string; // word + timestamp
}

// ── مؤشر الثقة بالشرح ─────────────────────────────────────────
const ConfidenceBadge = ({ level }: { level: string }) => {
  const map: Record<string, { label: string; color: string }> = {
    high:   { label: "تأكيد عالٍ",   color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"  },
    medium: { label: "تأكيد معقول", color: "text-amber-500  border-amber-500/30  bg-amber-500/5"   },
    low:    { label: "كلمة نادرة",   color: "text-rose-400   border-rose-400/30   bg-rose-400/5"    },
  };
  const { label, color } = map[level] ?? map.medium;
  return (
    <span className={`text-[10px] font-ui border rounded-full px-2 py-0.5 ${color}`}>
      {label}
    </span>
  );
};

// ── أيقونة القلم ───────────────────────────────────────────────
const PenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

// =============================================================
const TreasuresOfWords = () => {
  const [input,       setInput]       = useState("");
  const [verse,       setVerse]       = useState("");
  const [showVerse,   setShowVerse]   = useState(false);
  const [entries,     setEntries]     = useState<WordEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const { addHistoryItem } = useHistory();

  // ── الدالة الرئيسية: تستدعي الباك اند ────────────────────────
  const handleSearch = async (followup = false) => {
    const word = followup ? entries[activeIndex]?.word : input.trim();
    if (!word) return;

    setIsLoading(true);
    setError(null);

    if (!followup) addHistoryItem("treasures", "كنوز الكلمات", word);

    try {
      // ── هنا يصير الاتصال بالباك اند ──────────────────────────
      const result = await explainWord(
        word,
        verse.trim() || undefined,
        followup,
      );

      const entry: WordEntry = { ...result, id: `${word}-${Date.now()}` };

      if (followup) {
        // استبدال العنصر الحالي بشرح أوضح
        setEntries(prev => prev.map((e, i) => i === activeIndex ? entry : e));
      } else {
        setEntries(prev => [entry, ...prev]);
        setActiveIndex(0);
        setInput("");
        setVerse("");
        setShowVerse(false);
      }
    } catch (e) {
      if (e instanceof APIError) {
        setError(e.message);
      } else {
        setError("تعذّر الاتصال بالسيرفر، تأكد من تشغيل الباك اند.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const speakWord = (word: string) => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "ar-SA";
    speechSynthesis.speak(u);
  };

  const activeEntry = entries[activeIndex];

  return (
    <PageLayout title="كنوز الكلمات">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />

        <div className="max-w-6xl mx-auto relative z-10">

          {/* ── Header ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <BookOpen className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-foreground mb-2">كنوز الكلمات</h2>
            <p className="font-body text-muted-foreground">
              اكتب أي كلمة عربية صعبة واحصل على شرحها بعامية مفهومة
            </p>
          </motion.div>

          {/* ── حقل الإدخال ─────────────────────────────────────── */}
          <div className="max-w-lg mx-auto mb-4">
            <div className="relative glass-card p-2 flex items-center gap-2 glow-gold">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 pointer-events-none">
                <PenIcon />
              </div>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="اكتب الكلمة هنا... مثال: سَلَوتُ"
                className="font-display text-lg border-0 bg-transparent pr-10 focus-visible:ring-0 placeholder:text-muted-foreground/40"
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

            {/* زر إضافة البيت الشعري */}
            <button
              onClick={() => setShowVerse(v => !v)}
              className="mt-2 text-xs text-muted-foreground/60 hover:text-gold transition-colors flex items-center gap-1 mx-auto"
            >
              <Info className="h-3 w-3" />
              {showVerse ? "إخفاء" : "أضف البيت الشعري للسياق (اختياري)"}
            </button>

            <AnimatePresence>
              {showVerse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    value={verse}
                    onChange={e => setVerse(e.target.value)}
                    placeholder="البيت الشعري الذي فيه الكلمة..."
                    className="mt-2 font-display text-sm border-gold/20 bg-transparent placeholder:text-muted-foreground/30"
                    disabled={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── رسالة الخطأ ─────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-lg mx-auto mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-body"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── الكتاب المفتوح ──────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {activeEntry ? (
              <motion.div
                key={activeEntry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-5xl mx-auto"
              >
                {/* الصفحة اليمنى - الكلمة */}
                <div className="glass-card rounded-l-none md:rounded-r-2xl md:rounded-l-none p-8 md:p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-card to-secondary/30">

                  <Button
                    variant="ghost" size="icon"
                    className="text-gold hover:bg-gold/10 mb-4"
                    onClick={() => speakWord(activeEntry.word)}
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>

                  <h3 className="font-display text-5xl md:text-6xl text-foreground mb-3">
                    {activeEntry.word}
                  </h3>

                  {/* مؤشر الثقة */}
                  <div className="mb-4">
                    <ConfidenceBadge level={activeEntry.confidence} />
                  </div>

                  <div className="w-16 h-px bg-gold/50 mb-4" />

                  {/* بيت الشعر */}
                  {activeEntry.example_verse && (
                    <blockquote className="font-display text-sm text-muted-foreground leading-loose whitespace-pre-wrap">
                      {activeEntry.example_verse}
                    </blockquote>
                  )}

                  {/* زر "وضّح أكثر" */}
                  <Button
                    variant="ghost" size="sm"
                    className="mt-6 text-xs text-muted-foreground/50 hover:text-gold gap-1"
                    onClick={() => handleSearch(true)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3" />
                    وضّح أكثر
                  </Button>

                  {/* معجم سوار */}
                  {activeEntry.siwar.found && (
                    <div className="mt-4 text-[10px] text-muted-foreground/40 font-body border-t border-border/20 pt-3 w-full text-center">
                      ✦ مصدر: معجم سوار
                      {activeEntry.siwar.root && ` • جذر: ${activeEntry.siwar.root}`}
                    </div>
                  )}
                </div>

                {/* الصفحة اليسرى - الشرح */}
                <div className="glass-card rounded-r-none md:rounded-l-2xl md:rounded-r-none p-8 md:p-12 space-y-6 bg-gradient-to-bl from-card to-secondary/20">

                  {/* الملخص السريع */}
                  {activeEntry.simple_tip && (
                    <div className="p-3 rounded-lg bg-gold/5 border border-gold/15">
                      <p className="font-body text-sm text-gold/80 leading-relaxed">
                        💡 {activeEntry.simple_tip}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-ui text-xs text-gold mb-2 tracking-wider">المعنى</h4>
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">
                      {activeEntry.meaning}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-ui text-xs text-gold mb-2 tracking-wider">الاستخدام الشعري</h4>
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">
                      {activeEntry.poetic_usage}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-ui text-xs text-gold mb-2 tracking-wider">الرمزية والإحساس</h4>
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">
                      {activeEntry.symbolism}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── Empty State ── */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <BookOpen className="h-20 w-20 text-gold/20 mx-auto mb-4" />
                <p className="font-body text-muted-foreground/50 mb-2">
                  اكتب كلمة لتفتح صفحات كنوزها
                </p>
                <p className="font-body text-xs text-muted-foreground/30">
                  مثال: سَلَوتُ • مَثولَةَ • عُرّامَ • النوى • هِلالاً
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── الكلمات السابقة ──────────────────────────────────── */}
          {entries.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {entries.map((entry, i) => (
                <Button
                  key={entry.id}
                  variant={i === activeIndex ? "default" : "outline"}
                  size="sm"
                  className={`font-display ${
                    i === activeIndex
                      ? "bg-primary text-primary-foreground"
                      : "border-gold/30 text-foreground/60 hover:bg-gold/10"
                  }`}
                  onClick={() => setActiveIndex(i)}
                >
                  {entry.word}
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
