/**
 * صفحة تفسير الأبيات الشعرية — Poetry Verse Interpretation
 * — العنوان: "فسر الأبيات الشعرية"
 * — auto-scroll للنتائج عند الضغط
 * — تصميم موحّد بألوان بنية (مركز + بطاقات متفرعة)
 * — زر العودة للرئيسية في الأسفل
 *
 * نقطة ربط نموذج AI: الدالة interpretVerse
 */
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Loader2, Music, Heart, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import PageNavButton from "@/components/PageNavButton";
import { useHistory } from "@/contexts/HistoryContext";

interface InterpretationResult {
  mainInterpretation: string;
  meter: string;
  tone: string;
  era: string;
  poet: string;
}

interface InterpretationEntry {
  id: string;
  title: string;
  verse: string;
  result: InterpretationResult;
}

async function interpretVerse(_verse: string): Promise<InterpretationResult> {
  await new Promise((r) => setTimeout(r, 1800));
  return {
    mainInterpretation:
      "يقول الشاعر في هذا البيت إن الإنسان لازم يسعى ويتعب عشان يوصل لأهدافه، ما يكفي إنه يتمنى بس. الدنيا ما تعطيك اللي تبيه بسهولة — لازم تقاتل وتجتهد. وهذا المعنى عميق لأنه يعلّمنا إن النجاح يحتاج عمل مو كلام.",
    meter: "بحر الوافر",
    tone: "حكمة وتحفيز",
    era: "العصر العباسي (القرن 9م)",
    poet: "المتنبي",
  };
}

const summarize = (text: string, max = 28) => {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max) + "…" : t;
};

const branchCards = [
  { key: "meter" as const, label: "البحر الشعري", icon: Music },
  { key: "tone"  as const, label: "النوع والنبرة", icon: Heart },
  { key: "era"   as const, label: "العصر والتاريخ", icon: Calendar },
  { key: "poet"  as const, label: "الشاعر", icon: User },
];

const PoetryInterpretation = () => {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<InterpretationEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addHistoryItem } = useHistory();
  const resultsRef = useRef<HTMLDivElement>(null);

  const active = entries.find(e => e.id === activeId) ?? null;

  useEffect(() => {
    if (active) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeId]);

  const handleInterpret = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    addHistoryItem("interpret", "تفسير الأبيات", input);
    try {
      const data = await interpretVerse(input);
      const entry: InterpretationEntry = {
        id: crypto.randomUUID(),
        title: summarize(input),
        verse: input,
        result: data,
      };
      setEntries(prev => [entry, ...prev]);
      setActiveId(entry.id);
      setInput("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="تفسير الأبيات الشعرية">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg letters={["ت", "ف", "س", "ي", "ر"]} count={18} opacity={0.06} />
        <div className="max-w-5xl mx-auto relative z-10">
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
                onChange={(e) => setInput(e.target.value)}
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
            </div>
          </div>

          {/* النتائج */}
          <div ref={resultsRef} />
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <OrnamentalDivider />

              <div className="relative">
                {/* المركز: التفسير الرئيسي */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl p-8 max-w-2xl mx-auto mb-10 bg-brown-gradient text-primary-foreground glow-warm border border-brown-600/30"
                >
                  <h3 className="font-display text-xl mb-4 text-center">التفسير</h3>
                  <p className="font-body leading-loose text-center text-primary-foreground/95">
                    {result.mainInterpretation}
                  </p>
                </motion.div>

                {/* البطاقات الفرعية بنفس الثيم البنّي */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {branchCards.map((card, i) => (
                    <motion.div
                      key={card.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="relative"
                    >
                      <div className="hidden lg:block absolute -top-6 right-1/2 w-px h-6 bg-brown-400/40" />

                      <div className="glass-card-warm p-5 text-center hover:shadow-[var(--shadow-warm)] transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-brown-gradient mx-auto mb-3 flex items-center justify-center">
                          <card.icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h4 className="font-kufi text-xs text-brown-500 mb-2">{card.label}</h4>
                        <p className="font-display text-sm text-brown-700">{result[card.key]}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!result && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <MessageSquareText className="h-16 w-16 text-brown-300 mx-auto mb-4" />
              <p className="font-body text-brown-500/70">أدخل بيتاً شعرياً لتبدأ التفسير</p>
            </motion.div>
          )}

          {/* زر العودة للرئيسية */}
          <div className="mt-12 flex justify-center">
            <PageNavButton to="/write" label="التالي: كتابة الأبيات الشعرية" />
          </div>
          <div className="mt-4 flex justify-center">
            <PageNavButton to="/" label="العودة إلى الرئيسية" variant="home" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PoetryInterpretation;
