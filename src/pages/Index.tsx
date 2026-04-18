/**
 * الصفحة الرئيسية — لَسِنْ
 * Hero مع حروف "شعر" المتطايرة + بيت شعري + Roadmap دائري للميزات الخمس
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, PenLine, Clock, BookOpen, MessageSquareText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrnamentalDivider from "@/components/OrnamentalDivider";

// الترتيب الذي طلبه المستخدم لزر "ابدأ الرحلة"
const FIRST_PAGE = "/mood";

const features = [
  { title: "مزاج اليوم",       description: "اكتب مشاعرك واحصل على أبيات شعرية تعبّر عنك", icon: Heart,             url: "/mood" },
  { title: "رحلة عبر الزمن",   description: "شاهد كيف تطور التعبير عن المشاعر عبر العصور", icon: Clock,             url: "/journey" },
  { title: "تفسير الأبيات",    description: "أدخل بيتاً شعرياً واحصل على شرح مبسّط",        icon: MessageSquareText, url: "/interpret" },
  { title: "كتابة الأبيات",    description: "ولّد أبيات شعرية أو أكمل بيتاً ناقصاً",        icon: PenLine,           url: "/write" },
  { title: "كنوز الكلمات",     description: "اكتشف معاني الكلمات واستخداماتها الشعرية",     icon: BookOpen,          url: "/treasures" },
];

// حروف "شعر" متطايرة في الـ Hero
const POETRY_LETTERS = ["ش", "ع", "ر"];

// حروف "شعر" متطايرة — ممتدة لكامل الصفحة (fixed) بشفافية أعلى وتباعد أكبر
const HeroFloatingLetters = () => {
  // مواقع موزّعة على شبكة لتجنّب التداخل
  const items = Array.from({ length: 22 }).map((_, i) => {
    const letter = POETRY_LETTERS[i % POETRY_LETTERS.length];
    const cols = 5;
    const rows = 5;
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;
    const jitterX = (Math.random() - 0.5) * 10;
    const jitterY = (Math.random() - 0.5) * 10;
    return {
      letter,
      size: 26 + Math.random() * 22, // أصغر بكثير
      left: (col / (cols - 1)) * 100 + jitterX,
      top: (row / (rows - 1)) * 100 + jitterY,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * 5,
    };
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute font-display text-gradient-gold select-none"
          style={{
            fontSize: `${it.size}px`,
            left: `${it.left}%`,
            top: `${it.top}%`,
            opacity: 0.09,
          }}
          animate={{
            y: [0, -18, 0],
            x: [0, 6, -4, 0],
            rotate: [0, 3, -3, 0],
            opacity: [0.06, 0.14, 0.06],
          }}
          transition={{
            duration: it.duration,
            repeat: Infinity,
            delay: it.delay,
            ease: "easeInOut",
          }}
        >
          {it.letter}
        </motion.span>
      ))}
    </div>
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

// ── Roadmap دائري متوازن للميزات الخمس ──────────────────────
const RoadmapFeatures = ({ onSelect }: { onSelect: (url: string) => void }) => {
  const RADIUS = 38; // نسبة من حجم الحاوية
  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-square my-8">
      {/* خطوط زخرفية */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="hsl(var(--brown-300))" strokeWidth="0.25" strokeDasharray="0.6 1.2" opacity="0.4" />
        {features.map((_, i) => {
          const angle = (i / features.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(angle) * RADIUS;
          const y = 50 + Math.sin(angle) * RADIUS;
          return (
            <line
              key={i}
              x1="50" y1="50" x2={x} y2={y}
              stroke="hsl(var(--brown-400))"
              strokeWidth="0.2"
              strokeDasharray="0.6 0.8"
              opacity="0.35"
            />
          );
        })}
      </svg>

      {/* المركز */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-brown-gradient flex flex-col items-center justify-center shadow-[var(--shadow-warm)] border-2 border-gold/30">
          <span className="font-display text-3xl sm:text-4xl text-primary-foreground">لَسِنْ</span>
          <span className="font-kufi text-[10px] sm:text-xs text-primary-foreground/70 mt-1">رحلة الشعر</span>
        </div>
      </motion.div>

      {/* البطاقات حول المركز — مواضع متماثلة */}
      {features.map((feature, i) => {
        const angle = (i / features.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * RADIUS;
        const y = 50 + Math.sin(angle) * RADIUS;
        return (
          <motion.button
            key={feature.url}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
            whileHover={{ scale: 1.08, y: -4 }}
            onClick={() => onSelect(feature.url)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brown-soft border border-brown-300/50 shadow-[var(--shadow-soft)] flex flex-col items-center justify-center p-2 text-center transition-all hover:border-gold/50 hover:shadow-[var(--shadow-warm)]">
              <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-brown-700 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="font-kufi text-[11px] sm:text-xs text-brown-700 leading-tight">{feature.title}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-warm-page">
      {/* ===== Hero ===== */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <HeroFloatingLetters />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="space-y-6"
          >
            {/* الاسم */}
            <h1 className="font-display text-7xl sm:text-8xl md:text-9xl leading-none text-gradient-brown tracking-wide">
              لَسِنْ
            </h1>

            {/* خط زخرفي قصير */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-16 bg-brown-400/50" />
              <span className="text-brown-500 text-lg">✦</span>
              <div className="h-px w-16 bg-brown-400/50" />
            </div>

            {/* البيت الشعري المميز */}
            <motion.blockquote
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="font-amiri italic text-lg sm:text-xl md:text-2xl text-brown-700/90 leading-loose px-4"
            >
              دُنياكَ لَو حاوَرَتْكَ ناطِقَةً
              <span className="mx-3 text-brown-400">…</span>
              خاطَبْتَ مِنْها بَليغَةً لَسِنَه
            </motion.blockquote>

            {/* الوصف */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2 pt-4"
            >
              <p className="font-kufi text-base sm:text-lg text-brown-600 max-w-xl mx-auto">
                رحلة تفاعلية تعيد اكتشاف الشعر العربي بأسلوب عصري وسلس
              </p>
              <p className="font-body text-sm text-brown-500/80 max-w-lg mx-auto">
                من المعلّقات إلى الشعر الحديث — اشعر، اكتب، واستكشف جمال اللغة
              </p>
            </motion.div>

            {/* الأزرار */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap gap-3 justify-center pt-6"
            >
              <Button
                size="lg"
                className="font-ui text-base bg-brown-gradient text-primary-foreground gap-2 px-8 rounded-full glow-warm hover:shadow-[var(--shadow-warm)] border border-brown-600/30"
                onClick={() => navigate(FIRST_PAGE)}
              >
                ابدأ الرحلة
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-ui text-base border-brown-400/50 text-brown-700 hover:bg-brown-100/50 gap-2 px-8 rounded-full"
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                استكشف المزايا
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== Roadmap الميزات ===== */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-8"
          >
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl text-gradient-brown mb-3">
              خمس تجارب فريدة
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-kufi text-brown-600 max-w-lg mx-auto">
              كل تجربة صُمّمت لتقرّبك من الشعر العربي بطريقة مختلفة
            </motion.p>
          </motion.div>

          <OrnamentalDivider />

          <RoadmapFeatures onSelect={(url) => navigate(url)} />
        </div>
      </section>

      {/* ===== لماذا لَسِنْ ===== */}
      <section className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="font-display text-3xl md:text-4xl text-gradient-brown mb-6">
              لماذا لَسِنْ؟
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="font-body text-brown-700/80 max-w-2xl mx-auto leading-loose mb-12">
              نؤمن أن الشعر ليس حكراً على المتخصصين. هو مرآة مشاعرنا وتاريخنا ولغتنا.
              صمّمنا لَسِنْ ليكون بوابتك إلى عالم الشعر — بلا تعقيد، بلا حواجز، وبكل متعة.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "بسيط وسهل",     desc: "واجهة سلسة تجعل اكتشاف الشعر ممتعاً للجميع" },
                { title: "تفاعلي وذكي",   desc: "تقنيات حديثة تفهم مشاعرك وتقدّم لك ما يناسبك" },
                { title: "ثقافي وأصيل",   desc: "محتوى غني يربطك بجذور اللغة العربية وتراثها" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i + 2}
                  className="p-6 rounded-2xl bg-card/50 border border-brown-200/40 backdrop-blur-sm"
                >
                  <h3 className="font-display text-xl text-brown-700 mb-2">{item.title}</h3>
                  <p className="font-body text-sm text-brown-600/80">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-12 text-center bg-brown-gradient glow-warm border border-brown-600/30"
        >
          <h2 className="font-display text-3xl text-primary-foreground mb-4">
            ابدأ تجربتك الأولى في اكتشاف الشعر ومعانيه
          </h2>
          <p className="font-kufi text-primary-foreground/80 mb-8">
            اختر نقطة انطلاقتك ولنخطُ معاً في عالم الكلمة
          </p>
          <Button
            size="lg"
            className="font-ui bg-card text-brown-700 hover:bg-card/90 gap-2 px-10 rounded-full"
            onClick={() => navigate(FIRST_PAGE)}
          >
            ابدأ الآن
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 px-6 text-center border-t border-brown-200/40">
        <p className="font-display text-base text-brown-600/70">
          لَسِنْ — حيث يلتقي الشعر بالتقنية ✦
        </p>
      </footer>
    </div>
  );
};

export default Index;
