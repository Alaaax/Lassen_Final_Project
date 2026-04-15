/**
 * صفحة مزاج اليوم — مربوطة بالباك اند
 * الاتصال بالباك اند: getMoodPoems من api.ts
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
import { getMoodPoems, MoodResponse, PoemEntry, APIError } from "@/services/api";

interface UserMessage   { id: string; role: "user";      content: string   }
interface BotMessage    { id: string; role: "assistant";  data: MoodResponse }
type Message = UserMessage | BotMessage;

const SUGGESTED_MOODS = [
  "أشعر بالشوق لشخص بعيد",
  "قلبي حزين اليوم",
  "أبي أبيات دينية تريح قلبي",
  "زعلان من شخص خذلني",
  "أحبها بس المسافة بيننا بعيدة",
  "أبي كلمات تشجعني وتقويني",
];

// ── بطاقة بيت شعري ────────────────────────────────────────────
const PoemCard = ({ poem, index }: { poem: PoemEntry; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.12 }}
    className="glass-card p-4 rounded-xl border border-gold/15 space-y-2"
  >
    <blockquote className="font-display text-base text-foreground leading-loose text-center">
      {poem.verse}
    </blockquote>
    <div className="w-10 h-px bg-gold/30 mx-auto" />
    <p className="font-body text-xs text-muted-foreground leading-relaxed text-center">
      {poem.explanation}
    </p>
    {poem.poet && poem.poet !== "مجهول" && (
      <p className="font-ui text-[10px] text-gold/50 text-center">— {poem.poet}</p>
    )}
  </motion.div>
);

// ── رد المساعد ────────────────────────────────────────────────
const BotCard = ({ data }: { data: MoodResponse }) => (
  <div className="space-y-3 max-w-[88%]">
    <div className="glass-card px-5 py-4 rounded-2xl rounded-bl-sm">
      <p className="font-body text-sm text-foreground leading-relaxed">{data.opening_line}</p>
      <div className="flex gap-2 mt-2 flex-wrap">
        <span className="text-[10px] font-ui text-gold/60 border border-gold/20 rounded-full px-2 py-0.5">
          {data.feeling_detected}
        </span>
        <span className="text-[10px] text-muted-foreground/40">{data.feeling_intensity}</span>
        <span className="text-[10px] text-muted-foreground/30">• {data.category_used}</span>
      </div>
    </div>
    {data.poems.map((poem, i) => <PoemCard key={i} poem={poem} index={i} />)}
    {data.closing_line && (
      <div className="glass-card px-5 py-3 rounded-2xl rounded-bl-sm border-gold/10">
        <p className="font-body text-xs text-muted-foreground/70 leading-relaxed italic">
          {data.closing_line}
        </p>
      </div>
    )}
  </div>
);

// =============================================================
const MoodOfTheDay = () => {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addHistoryItem } = useHistory();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    setInput("");
    setError(null);
    addHistoryItem("mood", "مزاج اليوم", msg);

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: msg }]);
    setIsLoading(true);

    try {
      // ── الاتصال بالباك اند ──────────────────────────────────
      const result = await getMoodPoems(msg);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", data: result }]);
    } catch (e) {
      setError(e instanceof APIError ? e.message : "تعذّر الاتصال بالسيرفر");
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
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Sparkles className="h-12 w-12 text-gold mx-auto mb-6 animate-float" />
                <h2 className="font-display text-3xl text-foreground mb-3">كيف تشعر اليوم؟</h2>
                <p className="font-body text-muted-foreground mb-8 max-w-md">
                  اكتب مشاعرك أو اختر من الاقتراحات، وسنجد لك أبياتاً شعرية تعبّر عنك
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTED_MOODS.map(mood => (
                    <Button key={mood} variant="outline" size="sm"
                      className="font-ui border-gold/30 text-foreground/70 hover:bg-gold/10"
                      onClick={() => handleSend(mood)} disabled={isLoading}>
                      {mood}
                    </Button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "user" ? (
                      <div className="max-w-[75%] rounded-2xl rounded-br-sm px-5 py-4 bg-primary text-primary-foreground font-body text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <BotCard data={msg.data} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="glass-card px-5 py-4 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-2 h-2 bg-gold rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <p className="text-center text-xs text-rose-400 font-body">{error}</p>
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
              onChange={e => setInput(e.target.value)}
              placeholder="اكتب مشاعرك هنا..."
              className="font-body resize-none min-h-[50px] max-h-[120px] bg-card/60 border-border/50 focus:border-gold/50 rounded-xl"
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              disabled={isLoading}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
              size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-[50px] w-[50px] shrink-0">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default MoodOfTheDay;




























// /**
//  * صفحة مزاج اليوم - Mood of the Day
//  * المستخدم يكتب مشاعره ويحصل على أبيات شعرية مناسبة
//  * 
//  * === مكان ربط نموذج الذكاء الاصطناعي لمزاج اليوم ===
//  * استبدل الدالة getMoodPoetry بربط النموذج الخاص بك
//  */
// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Send, Sparkles } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import PageLayout from "@/components/PageLayout";
// import OrnamentalDivider from "@/components/OrnamentalDivider";
// import ArabicLettersBg from "@/components/ArabicLettersBg";
// import { useHistory } from "@/contexts/HistoryContext";

// interface Message {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
// }

// const suggestedMoods = [
//   "أشعر بالحنين",
//   "قلبي مليء بالفرح",
//   "أحتاج إلى أمل",
//   "أشعر بالوحدة",
//   "ممتن لكل شيء",
//   "أحس بالشوق",
// ];

// /**
//  * === نقطة ربط نموذج الذكاء الاصطناعي ===
//  * هذه الدالة هي المكان المخصص لربط نموذج AI لمزاج اليوم
//  * يجب أن تستقبل نص المشاعر وتعيد أبيات شعرية مناسبة
//  */
// async function getMoodPoetry(userInput: string): Promise<string> {
//   // TODO: استبدل هذا بربط نموذج الذكاء الاصطناعي
//   await new Promise((r) => setTimeout(r, 1500));
//   const responses: Record<string, string> = {
//     default: `يا ليلُ طِل أو لا تَطُل\nإنّ الغرامَ على حالِه\n\nهذا البيت يعكس مشاعرك — فالشعر مرآة الروح، وكل إحساس له بيت ينتظره.`,
//   };
//   return responses.default;
// }

// const MoodOfTheDay = () => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const scrollRef = useRef<HTMLDivElement>(null);
//   const { addHistoryItem } = useHistory();

//   useEffect(() => {
//     scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
//   }, [messages]);

//   const handleSend = async (text?: string) => {
//     const msg = text || input.trim();
//     if (!msg) return;

//     const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msg };
//     setMessages((prev) => [...prev, userMsg]);
//     setInput("");
//     setIsLoading(true);

//     // === حفظ في السجل ===
//     addHistoryItem("mood", "مزاج اليوم", msg);

//     try {
//       const response = await getMoodPoetry(msg);
//       const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: response };
//       setMessages((prev) => [...prev, assistantMsg]);
//     } catch {
//       setMessages((prev) => [
//         ...prev,
//         { id: crypto.randomUUID(), role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى." },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <PageLayout title="مزاج اليوم">
//       <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
//         <ArabicLettersBg />

//         {/* منطقة الرسائل */}
//         <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-6 relative z-10">
//           {messages.length === 0 ? (
//             /* الحالة الفارغة */
//             <div className="flex flex-col items-center justify-center h-full text-center">
//               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//                 <Sparkles className="h-12 w-12 text-gold mx-auto mb-6 animate-float" />
//                 <h2 className="font-display text-3xl text-foreground mb-3">كيف تشعر اليوم؟</h2>
//                 <p className="font-body text-muted-foreground mb-8 max-w-md">
//                   اكتب مشاعرك أو اختر من الاقتراحات، وسنجد لك أبياتاً شعرية تعبّر عنك
//                 </p>
//                 <div className="flex flex-wrap gap-2 justify-center max-w-lg">
//                   {suggestedMoods.map((mood) => (
//                     <Button
//                       key={mood}
//                       variant="outline"
//                       size="sm"
//                       className="font-ui border-gold/30 text-foreground/70 hover:bg-gold/10 hover:text-foreground"
//                       onClick={() => handleSend(mood)}
//                     >
//                       {mood}
//                     </Button>
//                   ))}
//                 </div>
//               </motion.div>
//             </div>
//           ) : (
//             <div className="max-w-3xl mx-auto space-y-6">
//               <AnimatePresence>
//                 {messages.map((msg) => (
//                   <motion.div
//                     key={msg.id}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-[80%] rounded-2xl px-5 py-4 font-body text-sm leading-relaxed whitespace-pre-wrap ${
//                         msg.role === "user"
//                           ? "bg-primary text-primary-foreground rounded-br-sm"
//                           : "glass-card text-foreground rounded-bl-sm"
//                       }`}
//                     >
//                       {msg.content}
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>
//               {isLoading && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
//                   <div className="glass-card px-5 py-4 rounded-2xl rounded-bl-sm">
//                     <div className="flex gap-1">
//                       {[0, 1, 2].map((i) => (
//                         <span
//                           key={i}
//                           className="w-2 h-2 bg-gold rounded-full animate-bounce"
//                           style={{ animationDelay: `${i * 0.15}s` }}
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 </motion.div>
//               )}
//             </div>
//           )}
//         </div>

//         <OrnamentalDivider className="my-0 mx-6" />

//         {/* حقل الإدخال */}
//         <div className="p-4 relative z-10">
//           <div className="max-w-3xl mx-auto flex gap-3 items-end">
//             <Textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="اكتب مشاعرك هنا..."
//               className="font-body resize-none min-h-[50px] max-h-[120px] bg-card/60 border-border/50 focus:border-gold/50 rounded-xl"
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   handleSend();
//                 }
//               }}
//             />
//             <Button
//               onClick={() => handleSend()}
//               disabled={!input.trim() || isLoading}
//               size="icon"
//               className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-[50px] w-[50px] shrink-0"
//             >
//               <Send className="h-5 w-5" />
//             </Button>
//           </div>
//         </div>
//       </div>
//     </PageLayout>
//   );
// };

// export default MoodOfTheDay;

