/**
 * صفحة تفسير الأبيات - Poetry Verse Interpretation
 * المستخدم يدخل بيتاً شعرياً ويحصل على شرح مفصل باللهجة السعودية
 * التصميم مستوحى من خريطة ذهنية
 *
 * === نقطة ربط نموذج الذكاء الاصطناعي لتفسير الأبيات ===
 * استبدل الدالة interpretVerse بربط النموذج الخاص بك
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Loader2, Music, Heart, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useHistory } from "@/contexts/HistoryContext";

interface InterpretationResult {
  mainInterpretation: string;
  meter: string;
  tone: string;
  era: string;
  poet: string;
}

/**
 * === نقطة ربط نموذج الذكاء الاصطناعي ===
 */
async function interpretVerse(verse: string): Promise<InterpretationResult> {
  // TODO: استبدل بربط نموذج AI لتفسير الأبيات
  await new Promise((r) => setTimeout(r, 2000));
  return {
    mainInterpretation: `يقول الشاعر في هذا البيت إن الإنسان لازم يسعى ويتعب عشان يوصل لأهدافه، ما يكفي إنه يتمنى بس. الدنيا ما تعطيك اللي تبيه بسهولة — لازم تقاتل وتجتهد. وهذا المعنى عميق لأنه يعلّمنا إن النجاح يحتاج عمل مو كلام.`,
    meter: "بحر الوافر",
    tone: "حكمة وتحفيز",
    era: "العصر العباسي (القرن 9م)",
    poet: "المتنبي",
  };
}

const branchCards = [
  { key: "meter" as const, label: "البحر الشعري", icon: Music, color: "from-amber-500/20 to-amber-600/10" },
  { key: "tone" as const, label: "النوع والنبرة", icon: Heart, color: "from-rose-500/20 to-rose-600/10" },
  { key: "era" as const, label: "العصر والتاريخ", icon: Calendar, color: "from-blue-500/20 to-blue-600/10" },
  { key: "poet" as const, label: "الشاعر", icon: User, color: "from-emerald-500/20 to-emerald-600/10" },
];

const PoetryInterpretation = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addHistoryItem } = useHistory();

  const handleInterpret = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    addHistoryItem("interpret", "تفسير الأبيات", input);
    try {
      const data = await interpretVerse(input);
      setResult(data);
    } catch {
      /* handle error */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="تفسير الأبيات">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <MessageSquareText className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-foreground mb-2">تفسير الأبيات</h2>
            <p className="font-body text-muted-foreground">أدخل بيتاً شعرياً واحصل على شرح مبسّط وواضح</p>
          </motion.div>

          {/* حقل الإدخال */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="glass-card p-6">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب بيتاً شعرياً هنا..."
                className="font-display text-lg min-h-[80px] bg-background/50 border-border/30 focus:border-gold/50 text-center leading-loose"
              />
              <Button
                onClick={handleInterpret}
                disabled={!input.trim() || isLoading}
                className="mt-4 w-full font-ui bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareText className="h-4 w-4" />}
                {isLoading ? "جارٍ التفسير..." : "فسّر البيت"}
              </Button>
            </div>
          </div>

          {/* نتيجة التفسير - خريطة ذهنية */}
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <OrnamentalDivider />

              <div className="relative">
                {/* الصندوق الرئيسي - التفسير */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-8 max-w-2xl mx-auto mb-8 glow-gold"
                >
                  <h3 className="font-display text-xl text-foreground mb-4 text-center">التفسير</h3>
                  <p className="font-body text-foreground/80 leading-loose text-center">
                    {result.mainInterpretation}
                  </p>
                </motion.div>

                {/* البطاقات الفرعية المتفرعة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {branchCards.map((card, i) => (
                    <motion.div
                      key={card.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="relative"
                    >
                      {/* خط الربط */}
                      <div className="hidden lg:block absolute -top-8 right-1/2 w-px h-8 bg-gold/30" />

                      <div className={`glass-card p-5 bg-gradient-to-br ${card.color} text-center`}>
                        <card.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                        <h4 className="font-ui text-xs text-muted-foreground mb-2">{card.label}</h4>
                        <p className="font-display text-sm text-foreground">{result[card.key]}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* حالة فارغة */}
          {!result && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <MessageSquareText className="h-16 w-16 text-gold/20 mx-auto mb-4" />
              <p className="font-body text-muted-foreground/50">أدخل بيتاً شعرياً لتبدأ التفسير</p>
            </motion.div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default PoetryInterpretation;
