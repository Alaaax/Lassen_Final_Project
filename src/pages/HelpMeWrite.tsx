/**
 * صفحة ساعدني أكتب - Help Me Write
 * وظيفتان: توليد أبيات شعرية + إكمال أبيات ناقصة
 *
 * === نقاط ربط نماذج الذكاء الاصطناعي ===
 * 1. generatePoetry - لتوليد الأبيات
 * 2. completeVerse - لإكمال الأبيات الناقصة
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, Wand2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useHistory } from "@/contexts/HistoryContext";

/**
 * === نقطة ربط نموذج توليد الأبيات الشعرية ===
 */
async function generatePoetry(idea: string): Promise<string> {
  // TODO: استبدل بربط نموذج AI لتوليد الشعر
  await new Promise((r) => setTimeout(r, 1500));
  return `من وحي "${idea}":\n\nإذا المرءُ لا يرعاكَ إلا تكلُّفاً\nفدعْهُ ولا تُكثِر عليه التأسُّفا\n\n— هذا مثال توضيحي، سيُستبدل بنتائج النموذج`;
}

/**
 * === نقطة ربط نموذج إكمال الأبيات ===
 */
async function completeVerse(partial: string): Promise<string> {
  // TODO: استبدل بربط نموذج AI لإكمال الأبيات
  await new Promise((r) => setTimeout(r, 1500));
  return `البيت الكامل:\n\n"${partial}... فدعْهُ ولا تُكثِر عليه التأسُّفا"\n\n— هذا مثال توضيحي`;
}

const HelpMeWrite = () => {
  const [generateInput, setGenerateInput] = useState("");
  const [completeInput, setCompleteInput] = useState("");
  const [generateResult, setGenerateResult] = useState("");
  const [completeResult, setCompleteResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { addHistoryItem } = useHistory();

  const handleGenerate = async () => {
    if (!generateInput.trim()) return;
    setIsGenerating(true);
    setGenerateResult("");
    addHistoryItem("write", "ساعدني أكتب", generateInput);
    try {
      const result = await generatePoetry(generateInput);
      setGenerateResult(result);
    } catch {
      setGenerateResult("عذراً، حدث خطأ. حاول مرة أخرى.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    if (!completeInput.trim()) return;
    setIsCompleting(true);
    setCompleteResult("");
    addHistoryItem("write", "ساعدني أكتب", completeInput);
    try {
      const result = await completeVerse(completeInput);
      setCompleteResult(result);
    } catch {
      setCompleteResult("عذراً، حدث خطأ. حاول مرة أخرى.");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <PageLayout title="ساعدني أكتب">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <PenLine className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-foreground mb-2">ساعدني أكتب</h2>
            <p className="font-body text-muted-foreground">ولّد أبياتاً شعرية أو أكمل بيتاً ناقصاً</p>
          </motion.div>

          <Tabs defaultValue="generate" className="w-full" dir="rtl">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-card/80 border border-border/50 mb-8 h-12">
              <TabsTrigger value="generate" className="font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                توليد أبيات
              </TabsTrigger>
              <TabsTrigger value="complete" className="font-ui data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                إكمال بيت
              </TabsTrigger>
            </TabsList>

            {/* === قسم توليد الأبيات === */}
            <TabsContent value="generate">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="glass-card p-8">
                  <label className="font-ui text-sm text-foreground/70 mb-3 block">اكتب فكرة أو موضوعاً</label>
                  <Textarea
                    value={generateInput}
                    onChange={(e) => setGenerateInput(e.target.value)}
                    placeholder="مثال: الشوق إلى الوطن، جمال الصحراء، الحب الأول..."
                    className="font-body min-h-[100px] bg-background/50 border-border/30 focus:border-gold/50"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={!generateInput.trim() || isGenerating}
                    className="mt-4 font-ui bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {isGenerating ? "جارٍ التوليد..." : "ولّد أبيات"}
                  </Button>
                </div>

                {generateResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <OrnamentalDivider />
                    <div className="glass-card p-8">
                      <p className="font-display text-lg text-foreground whitespace-pre-wrap leading-loose text-center">
                        {generateResult}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>

            {/* === قسم إكمال الأبيات === */}
            <TabsContent value="complete">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="glass-card p-8">
                  <label className="font-ui text-sm text-foreground/70 mb-3 block">اكتب بيتاً ناقصاً أو شطراً</label>
                  <Textarea
                    value={completeInput}
                    onChange={(e) => setCompleteInput(e.target.value)}
                    placeholder="مثال: إذا المرءُ لا يرعاكَ إلا تكلُّفاً..."
                    className="font-body min-h-[100px] bg-background/50 border-border/30 focus:border-gold/50"
                  />
                  <Button
                    onClick={handleComplete}
                    disabled={!completeInput.trim() || isCompleting}
                    className="mt-4 font-ui bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  >
                    {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
                    {isCompleting ? "جارٍ البحث..." : "أكمل البيت"}
                  </Button>
                </div>

                {completeResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <OrnamentalDivider />
                    <div className="glass-card p-8">
                      <p className="font-display text-lg text-foreground whitespace-pre-wrap leading-loose text-center">
                        {completeResult}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpMeWrite;
