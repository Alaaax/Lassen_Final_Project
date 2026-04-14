/**
 * صفحة كنوز الكلمات - Treasures of Words
 * المستخدم يدخل كلمة ويحصل على شرحها ومعانيها الشعرية
 * التصميم مستوحى من كتاب مفتوح
 *
 * === نقطة ربط نموذج الذكاء الاصطناعي لكنوز الكلمات ===
 * استبدل الدالة getWordTreasure بربط النموذج الخاص بك
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import { useHistory } from "@/contexts/HistoryContext";

interface WordEntry {
  word: string;
  meaning: string;
  poeticUsage: string;
  symbolism: string;
  exampleVerse: string;
}

/**
 * === نقطة ربط نموذج الذكاء الاصطناعي ===
 */
async function getWordTreasure(word: string): Promise<WordEntry> {
  // TODO: استبدل بربط نموذج AI لكنوز الكلمات
  await new Promise((r) => setTimeout(r, 1500));
  return {
    word,
    meaning: `"${word}" — كلمة عربية أصيلة تحمل معانٍ عميقة في اللغة والأدب. تُستخدم للتعبير عن حالة شعورية دقيقة لا تجدها في لغة أخرى.`,
    poeticUsage: `استخدمها الشعراء العرب عبر العصور في سياقات مختلفة، من الغزل إلى الحكمة إلى الرثاء. تتميز بإيقاعها الموسيقي الذي يضفي جمالاً على البيت الشعري.`,
    symbolism: `ترمز في الشعر العربي إلى العمق والأصالة، وتحمل دلالات تتجاوز معناها الحرفي لتعبّر عن تجارب إنسانية عميقة.`,
    exampleVerse: `وَما نَيلُ المَطالِبِ بِالتَمَنّي\nوَلَكِن تُؤخَذُ الدُنيا غِلابا`,
  };
}

const TreasuresOfWords = () => {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { addHistoryItem } = useHistory();

  const handleSearch = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    addHistoryItem("treasures", "كنوز الكلمات", input);
    try {
      const result = await getWordTreasure(input);
      setEntries((prev) => [result, ...prev]);
      setActiveIndex(0);
      setInput("");
    } catch {
      /* handle error */
    } finally {
      setIsLoading(false);
    }
  };

  const activeEntry = entries[activeIndex];

  return (
    <PageLayout title="كنوز الكلمات">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <BookOpen className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-foreground mb-2">كنوز الكلمات</h2>
            <p className="font-body text-muted-foreground">اكتشف جمال الكلمات العربية ومعانيها الشعرية</p>
          </motion.div>

          {/* حقل البحث المبدع */}
          <div className="max-w-lg mx-auto mb-12">
            <div className="relative glass-card p-2 flex items-center gap-2 glow-gold">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 pointer-events-none">
                <PenIcon />
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب كلمة لاكتشاف كنوزها..."
                className="font-display text-lg border-0 bg-transparent pr-10 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 font-ui"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                اكتشف
              </Button>
            </div>
          </div>

          {/* تصميم الكتاب المفتوح */}
          <AnimatePresence mode="wait">
            {activeEntry ? (
              <motion.div
                key={activeEntry.word}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-5xl mx-auto"
              >
                {/* الصفحة اليمنى - الكلمة */}
                <div className="glass-card rounded-l-none md:rounded-r-2xl md:rounded-l-none p-8 md:p-12 flex flex-col items-center justify-center text-center border-l-0 md:border-l-0 bg-gradient-to-br from-card to-secondary/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gold hover:bg-gold/10 mb-4"
                    onClick={() => {
                      // TODO: ربط نطق الكلمة
                      const utterance = new SpeechSynthesisUtterance(activeEntry.word);
                      utterance.lang = "ar-SA";
                      speechSynthesis.speak(utterance);
                    }}
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                  <h3 className="font-display text-5xl md:text-6xl text-foreground mb-4">{activeEntry.word}</h3>
                  <div className="w-16 h-px bg-gold/50 mb-4" />
                  <blockquote className="font-display text-sm text-muted-foreground leading-loose whitespace-pre-wrap">
                    {activeEntry.exampleVerse}
                  </blockquote>
                </div>

                {/* الصفحة اليسرى - الشرح */}
                <div className="glass-card rounded-r-none md:rounded-l-2xl md:rounded-r-none p-8 md:p-12 space-y-6 bg-gradient-to-bl from-card to-secondary/20">
                  <div>
                    <h4 className="font-ui text-xs text-gold mb-2 tracking-wider">المعنى</h4>
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">{activeEntry.meaning}</p>
                  </div>
                  <div>
                    <h4 className="font-ui text-xs text-gold mb-2 tracking-wider">الاستخدام الشعري</h4>
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">{activeEntry.poeticUsage}</p>
                  </div>
                  <div>
                    <h4 className="font-ui text-xs text-gold mb-2 tracking-wider">الرمزية</h4>
                    <p className="font-body text-sm text-foreground/80 leading-relaxed">{activeEntry.symbolism}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <BookOpen className="h-20 w-20 text-gold/20 mx-auto mb-4" />
                <p className="font-body text-muted-foreground/50">اكتب كلمة لتفتح صفحات كنوزها</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* الكلمات السابقة */}
          {entries.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              {entries.map((entry, i) => (
                <Button
                  key={`${entry.word}-${i}`}
                  variant={i === activeIndex ? "default" : "outline"}
                  size="sm"
                  className={`font-display ${
                    i === activeIndex ? "bg-primary text-primary-foreground" : "border-gold/30 text-foreground/60 hover:bg-gold/10"
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

/* أيقونة القلم */
const PenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export default TreasuresOfWords;
