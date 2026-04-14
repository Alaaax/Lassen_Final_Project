/**
 * صفحة رحلة عبر الزمن - Journey Through Time
 * عرض تطور التعبير الشعري عبر العصور
 *
 * === نقطة ربط نموذج الذكاء الاصطناعي لرحلة عبر الزمن ===
 * استبدل الدالة getJourneyData بربط النموذج الخاص بك
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useHistory } from "@/contexts/HistoryContext";

interface EraEntry {
  era: string;
  period: string;
  poet: string;
  verse: string;
  explanation: string;
}

const themes = ["الحزن", "الحب", "الشوق", "الحكمة", "الوفاء", "الفخر", "الأمل", "الفراق"];

/**
 * === نقطة ربط نموذج الذكاء الاصطناعي ===
 */
async function getJourneyData(theme: string): Promise<EraEntry[]> {
  // TODO: استبدل بربط نموذج AI لرحلة عبر الزمن
  await new Promise((r) => setTimeout(r, 2000));
  return [
    {
      era: "الجاهلي",
      period: "قبل الإسلام",
      poet: "امرؤ القيس",
      verse: "قِفا نَبكِ مِن ذِكرى حَبيبٍ وَمَنزِلِ",
      explanation: `التعبير عن ${theme} في العصر الجاهلي كان مباشراً وقوياً، مرتبطاً بالطبيعة والصحراء`,
    },
    {
      era: "العباسي",
      period: "750-1258م",
      poet: "أبو تمام",
      verse: "نَقِّل فُؤادَكَ حَيثُ شِئتَ مِنَ الهَوى",
      explanation: `في العصر العباسي أصبح التعبير عن ${theme} أكثر تعقيداً وفلسفةً`,
    },
    {
      era: "الأندلسي",
      period: "711-1492م",
      poet: "ابن زيدون",
      verse: "أَضحى التَنائي بَديلاً مِن تَدانينا",
      explanation: `تأثر شعراء الأندلس بالطبيعة الخضراء، فجاء تعبيرهم عن ${theme} رقيقاً وعذباً`,
    },
    {
      era: "الحديث",
      period: "القرن 20-21",
      poet: "نزار قباني",
      verse: "علّمني حبّكِ أن أحزنَ وأنا محتاجٌ منذ عصور لامرأةٍ تجعلني أحزن",
      explanation: `في العصر الحديث أصبح التعبير عن ${theme} شخصياً وجريئاً ومتحرراً من القيود التقليدية`,
    },
  ];
}

const eraColors = ["bg-amber-500/20", "bg-emerald-500/20", "bg-blue-500/20", "bg-rose-500/20"];

const JourneyThroughTime = () => {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [entries, setEntries] = useState<EraEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addHistoryItem } = useHistory();

  const handleExplore = async (theme: string) => {
    setSelectedTheme(theme);
    setIsLoading(true);
    setEntries([]);
    addHistoryItem("journey", "رحلة عبر الزمن", theme);
    try {
      const data = await getJourneyData(theme);
      setEntries(data);
    } catch {
      /* handle error */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="رحلة عبر الزمن">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <Clock className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-foreground mb-2">رحلة عبر الزمن</h2>
            <p className="font-body text-muted-foreground">اختر شعوراً وشاهد كيف عبّر عنه الشعراء عبر العصور</p>
          </motion.div>

          {/* اختيار الموضوع */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {themes.map((theme) => (
              <Button
                key={theme}
                variant={selectedTheme === theme ? "default" : "outline"}
                className={`font-ui ${
                  selectedTheme === theme
                    ? "bg-primary text-primary-foreground"
                    : "border-gold/30 text-foreground/70 hover:bg-gold/10"
                }`}
                onClick={() => handleExplore(theme)}
              >
                {theme}
              </Button>
            ))}
          </div>

          {/* حالة التحميل */}
          {isLoading && (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="h-8 w-8 text-gold animate-spin mb-4" />
              <p className="font-body text-muted-foreground">نسافر عبر الزمن...</p>
            </div>
          )}

          {/* الخط الزمني */}
          <AnimatePresence>
            {entries.length > 0 && !isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <OrnamentalDivider />
                <div className="relative">
                  {/* الخط الرأسي */}
                  <div className="absolute right-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/50 via-gold/20 to-transparent" />

                  {entries.map((entry, i) => (
                    <motion.div
                      key={entry.era}
                      initial={{ opacity: 0, x: i % 2 === 0 ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.2, duration: 0.5 }}
                      className={`flex items-start gap-8 mb-12 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                    >
                      {/* البطاقة */}
                      <div className={`flex-1 glass-card p-6 ${eraColors[i % eraColors.length]}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-display text-xl text-foreground">{entry.era}</span>
                          <span className="text-xs font-ui text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {entry.period}
                          </span>
                        </div>
                        <blockquote className="font-display text-lg text-foreground/90 border-r-2 border-gold/50 pr-4 mb-3 leading-loose">
                          {entry.verse}
                        </blockquote>
                        <p className="font-ui text-xs text-muted-foreground mb-2">— {entry.poet}</p>
                        <p className="font-body text-sm text-muted-foreground leading-relaxed">{entry.explanation}</p>
                      </div>

                      {/* النقطة الزمنية */}
                      <div className="flex flex-col items-center shrink-0 pt-6">
                        <div className="w-4 h-4 rounded-full bg-gold border-4 border-background shadow-lg" />
                      </div>

                      <div className="flex-1" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* الحالة الفارغة */}
          {!selectedTheme && !isLoading && entries.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Sparkles className="h-16 w-16 text-gold/30 mx-auto mb-4" />
              <p className="font-body text-muted-foreground/50">اختر شعوراً لتبدأ الرحلة</p>
            </motion.div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default JourneyThroughTime;
