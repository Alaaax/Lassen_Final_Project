/**
 * صفحة مزاج اليوم - Mood of the Day
 * المستخدم يكتب مشاعره ويحصل على أبيات شعرية مناسبة
 * 
 * === مكان ربط نموذج الذكاء الاصطناعي لمزاج اليوم ===
 * استبدل الدالة getMoodPoetry بربط النموذج الخاص بك
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageLayout from "@/components/PageLayout";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import { useHistory } from "@/contexts/HistoryContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedMoods = [
  "أشعر بالحنين",
  "قلبي مليء بالفرح",
  "أحتاج إلى أمل",
  "أشعر بالوحدة",
  "ممتن لكل شيء",
  "أحس بالشوق",
];

/**
 * === نقطة ربط نموذج الذكاء الاصطناعي ===
 * هذه الدالة هي المكان المخصص لربط نموذج AI لمزاج اليوم
 * يجب أن تستقبل نص المشاعر وتعيد أبيات شعرية مناسبة
 */
async function getMoodPoetry(userInput: string): Promise<string> {
  // TODO: استبدل هذا بربط نموذج الذكاء الاصطناعي
  await new Promise((r) => setTimeout(r, 1500));
  const responses: Record<string, string> = {
    default: `يا ليلُ طِل أو لا تَطُل\nإنّ الغرامَ على حالِه\n\nهذا البيت يعكس مشاعرك — فالشعر مرآة الروح، وكل إحساس له بيت ينتظره.`,
  };
  return responses.default;
}

const MoodOfTheDay = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addHistoryItem } = useHistory();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // === حفظ في السجل ===
    addHistoryItem("mood", "مزاج اليوم", msg);

    try {
      const response = await getMoodPoetry(msg);
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="مزاج اليوم">
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
        <ArabicLettersBg />

        {/* منطقة الرسائل */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-6 relative z-10">
          {messages.length === 0 ? (
            /* الحالة الفارغة */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Sparkles className="h-12 w-12 text-gold mx-auto mb-6 animate-float" />
                <h2 className="font-display text-3xl text-foreground mb-3">كيف تشعر اليوم؟</h2>
                <p className="font-body text-muted-foreground mb-8 max-w-md">
                  اكتب مشاعرك أو اختر من الاقتراحات، وسنجد لك أبياتاً شعرية تعبّر عنك
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {suggestedMoods.map((mood) => (
                    <Button
                      key={mood}
                      variant="outline"
                      size="sm"
                      className="font-ui border-gold/30 text-foreground/70 hover:bg-gold/10 hover:text-foreground"
                      onClick={() => handleSend(mood)}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-4 font-body text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "glass-card text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="glass-card px-5 py-4 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-gold rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <OrnamentalDivider className="my-0 mx-6" />

        {/* حقل الإدخال */}
        <div className="p-4 relative z-10">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب مشاعرك هنا..."
              className="font-body resize-none min-h-[50px] max-h-[120px] bg-card/60 border-border/50 focus:border-gold/50 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-[50px] w-[50px] shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MoodOfTheDay;
