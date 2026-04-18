/**
 * صفحة كتابة الأبيات الشعرية — Help Me Write
 * — توليد الأبيات + إكمال البيت
 * — auto-scroll للنتائج + سجل لكل ميزة (يمين: العنوان، يسار: السجلّ)
 * — زر تنقل: التالي = كنوز الكلمات
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Wand2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import PageNavButton from "@/components/PageNavButton";
import { useHistory } from "@/contexts/HistoryContext";

// === نقاط ربط النماذج (لا تغيّر بنية التواقيع) ================
async function generatePoetry(idea: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500));
  return `من وحي "${idea}":\n\nإذا المرءُ لا يرعاكَ إلا تكلُّفاً\nفدعْهُ ولا تُكثِر عليه التأسُّفا\n\n— هذا مثال توضيحي، سيُستبدل بنتائج النموذج`;
}
async function completeVerse(partial: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1500));
  return `البيت الكامل:\n\n"${partial}... فدعْهُ ولا تُكثِر عليه التأسُّفا"\n\n— هذا مثال توضيحي`;
}

interface HistoryEntry {
  id: string;
  title: string;
  prompt: string;
  result: string;
}

const summarize = (text: string, max = 30) => {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max) + "…" : t;
};

const ResultCard = ({ entry }: { entry: HistoryEntry }) => (
  <div className="glass-card-warm p-5 rounded-xl">
    <p className="font-ui text-xs text-brown-500 mb-2">— {entry.title}</p>
    <p className="font-amiri text-base text-brown-700 whitespace-pre-wrap leading-loose text-center">
      {entry.result}
    </p>
  </div>
);

interface FeatureSectionProps {
  label: string;
  placeholder: string;
  buttonIdle: string;
  buttonLoading: string;
  buttonIcon: React.ReactNode;
  historyTitle: string;
  history: HistoryEntry[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

const FeatureSection = ({
  label, placeholder, buttonIdle, buttonLoading, buttonIcon,
  historyTitle, history, activeId, setActiveId,
  input, setInput, isLoading, onSubmit,
}: FeatureSectionProps) => {
  const active = history.find(h => h.id === activeId) ?? history[0] ?? null;
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [active?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* اليمين: الميزة + الناتج النشط */}
      <div className="lg:col-span-2 order-1">
        <div className="glass-card-warm p-8">
          <label className="font-ui text-sm text-brown-700 mb-3 block">{label}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="font-body min-h-[100px] bg-background/60 border-brown-300/40 focus:border-brown-500/60"
          />
          <Button
            onClick={onSubmit}
            disabled={!input.trim() || isLoading}
            className="mt-4 font-ui bg-brown-gradient text-primary-foreground gap-2 rounded-full px-6"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonIcon}
            {isLoading ? buttonLoading : buttonIdle}
          </Button>
        </div>

        <div ref={resultsRef} />
        {active && (
          <div className="mt-6">
            <OrnamentalDivider className="my-4" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <ResultCard entry={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* اليسار: السجل القابل للنقر */}
      <aside className="order-2 lg:sticky lg:top-20 lg:self-start">
        <div className="glass-card p-4">
          <h3 className="font-kufi text-sm text-brown-700 mb-3">{historyTitle}</h3>
          {history.length === 0 ? (
            <p className="font-body text-xs text-brown-500/60">لا يوجد سجل بعد</p>
          ) : (
            <ul className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {history.map(e => {
                const isActive = (active?.id ?? history[0]?.id) === e.id;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => setActiveId(e.id)}
                      className={`w-full text-right text-xs font-ui px-3 py-2 rounded-lg border transition-all ${
                        isActive
                          ? "bg-brown-gradient text-primary-foreground border-brown-600/40 shadow-[var(--shadow-soft)]"
                          : "bg-brown-100/40 text-brown-700 border-brown-200/40 hover:bg-brown-100/70"
                      }`}
                    >
                      {e.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

const HelpMeWrite = () => {
  const [generateInput, setGenerateInput] = useState("");
  const [completeInput, setCompleteInput] = useState("");
  const [generateHistory, setGenerateHistory] = useState<HistoryEntry[]>([]);
  const [completeHistory, setCompleteHistory] = useState<HistoryEntry[]>([]);
  const [generateActiveId, setGenerateActiveId] = useState<string | null>(null);
  const [completeActiveId, setCompleteActiveId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { addHistoryItem } = useHistory();

  const handleGenerate = async () => {
    if (!generateInput.trim()) return;
    setIsGenerating(true);
    addHistoryItem("write", "ساعدني أكتب", generateInput);
    try {
      const result = await generatePoetry(generateInput);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        title: summarize(generateInput),
        prompt: generateInput,
        result,
      };
      setGenerateHistory(prev => [entry, ...prev]);
      setGenerateActiveId(entry.id);
      setGenerateInput("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    if (!completeInput.trim()) return;
    setIsCompleting(true);
    addHistoryItem("write", "ساعدني أكتب", completeInput);
    try {
      const result = await completeVerse(completeInput);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        title: summarize(completeInput),
        prompt: completeInput,
        result,
      };
      setCompleteHistory(prev => [entry, ...prev]);
      setCompleteActiveId(entry.id);
      setCompleteInput("");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <PageLayout title="كتابة الأبيات الشعرية">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg letters={["ك", "ت", "ا", "ب", "ة"]} count={18} opacity={0.06} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <PenLine className="h-10 w-10 text-brown-600 mx-auto mb-4" />
            <h2 className="font-display text-3xl text-gradient-brown mb-2">كتابة الأبيات الشعرية</h2>
            <p className="font-kufi text-brown-600">ولّد أبياتاً شعرية أو أكمل بيتاً ناقصاً</p>
          </motion.div>

          <Tabs defaultValue="generate" className="w-full" dir="rtl">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-card/70 border border-brown-200/50 mb-8 h-12 rounded-xl">
              <TabsTrigger value="generate" className="font-ui data-[state=active]:bg-brown-gradient data-[state=active]:text-primary-foreground rounded-lg">
                توليد أبيات
              </TabsTrigger>
              <TabsTrigger value="complete" className="font-ui data-[state=active]:bg-brown-gradient data-[state=active]:text-primary-foreground rounded-lg">
                إكمال بيت
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <FeatureSection
                label="اكتب فكرة أو موضوعاً"
                placeholder="مثال: الشوق إلى الوطن، جمال الصحراء، الحب الأول..."
                buttonIdle="ولّد أبيات"
                buttonLoading="جارٍ التوليد..."
                buttonIcon={<Wand2 className="h-4 w-4" />}
                historyTitle="سجل التوليد"
                history={generateHistory}
                activeId={generateActiveId}
                setActiveId={setGenerateActiveId}
                input={generateInput}
                setInput={setGenerateInput}
                isLoading={isGenerating}
                onSubmit={handleGenerate}
              />
            </TabsContent>

            <TabsContent value="complete">
              <FeatureSection
                label="اكتب بيتاً ناقصاً أو شطراً"
                placeholder="مثال: إذا المرءُ لا يرعاكَ إلا تكلُّفاً..."
                buttonIdle="أكمل البيت"
                buttonLoading="جارٍ البحث..."
                buttonIcon={<ArrowLeft className="h-4 w-4" />}
                historyTitle="سجل الإكمال"
                history={completeHistory}
                activeId={completeActiveId}
                setActiveId={setCompleteActiveId}
                input={completeInput}
                setInput={setCompleteInput}
                isLoading={isCompleting}
                onSubmit={handleComplete}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-12 flex justify-center">
            <PageNavButton to="/treasures" label="التالي: كنوز الكلمات" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpMeWrite;
