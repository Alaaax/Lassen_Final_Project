/**
 * الصفحة الرئيسية - Landing Page
 * تحتوي على: العنوان الرئيسي، وصف المشروع، بطاقات الميزات، قسم لماذا، ودعوة للعمل
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, PenLine, Clock, BookOpen, MessageSquareText, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import bgTexture from "@/assets/bg-texture.png";

const features = [
  {
    title: "مزاج اليوم",
    description: "اكتب مشاعرك واحصل على أبيات شعرية تعبّر عنك",
    icon: Heart,
    url: "/mood",
    color: "from-rose-500/20 to-pink-500/10",
  },
  {
    title: "ساعدني أكتب",
    description: "ولّد أبيات شعرية أو أكمل بيتاً ناقصاً",
    icon: PenLine,
    url: "/write",
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    title: "رحلة عبر الزمن",
    description: "شاهد كيف تطور التعبير عن المشاعر عبر العصور",
    icon: Clock,
    url: "/journey",
    color: "from-amber-500/20 to-yellow-500/10",
  },
  {
    title: "كنوز الكلمات",
    description: "اكتشف معاني الكلمات واستخداماتها الشعرية",
    icon: BookOpen,
    url: "/treasures",
    color: "from-blue-500/20 to-indigo-500/10",
  },
  {
    title: "تفسير الأبيات",
    description: "أدخل بيتاً شعرياً واحصل على شرح مبسّط وواضح",
    icon: MessageSquareText,
    url: "/interpret",
    color: "from-purple-500/20 to-violet-500/10",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ArabicLettersBg />

      {/* ===== قسم البطل (Hero) ===== */}
      <section
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url(${bgTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <Sparkles className="h-8 w-8 text-gold mx-auto mb-4 animate-float" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 leading-tight">
              بيت <span className="text-gradient-gold">القصيد</span>
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              رحلة تفاعلية تعيد اكتشاف الشعر العربي بأسلوب عصري وسلس
            </p>
            <p className="font-body text-sm md:text-base text-muted-foreground/70 max-w-xl mx-auto mb-10">
              من المعلّقات إلى الشعر الحديث — اشعر، اكتب، واستكشف جمال اللغة العربية
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button
              size="lg"
              className="font-ui text-base bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 glow-gold"
              onClick={() => navigate("/mood")}
            >
              ابدأ الرحلة
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-ui text-base border-gold/30 text-foreground hover:bg-gold/10 gap-2 px-8"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              استكشف المزايا
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ===== قسم المزايا ===== */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display text-3xl md:text-4xl text-foreground mb-4"
            >
              خمس تجارب فريدة
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="font-body text-muted-foreground max-w-lg mx-auto"
            >
              كل تجربة صُمّمت لتقرّبك من الشعر العربي بطريقة مختلفة
            </motion.p>
          </motion.div>

          <OrnamentalDivider />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {features.map((feature, i) => (
              <motion.div
                key={feature.url}
                custom={i + 2}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`glass-card p-8 cursor-pointer group bg-gradient-to-br ${feature.color}`}
                onClick={() => navigate(feature.url)}
              >
                <feature.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-display text-xl text-foreground mb-2">{feature.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-primary font-ui text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>استكشف</span>
                  <ArrowLeft className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== لماذا بيت القصيد ===== */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display text-3xl md:text-4xl text-foreground mb-6"
            >
              لماذا بيت القصيد؟
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12"
            >
              نؤمن أن الشعر ليس حكراً على المتخصصين. هو مرآة مشاعرنا وتاريخنا ولغتنا. 
              صمّمنا هذه المنصة لتكون بوابتك لعالم الشعر — بلا تعقيد، بلا حواجز، وبكل متعة.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "بسيط وسهل", desc: "واجهة سلسة تجعل اكتشاف الشعر ممتعاً للجميع" },
                { title: "تفاعلي وذكي", desc: "تقنيات حديثة تفهم مشاعرك وتقدّم لك ما يناسبك" },
                { title: "ثقافي وأصيل", desc: "محتوى غني يربطك بجذور اللغة العربية وتراثها" },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i + 2} className="p-6">
                  <h3 className="font-display text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== دعوة للعمل ===== */}
      <section className="py-24 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-card p-12 text-center glow-gold"
        >
          <h2 className="font-display text-3xl text-foreground mb-4">
            جاهز تبدأ رحلتك مع الشعر؟
          </h2>
          <p className="font-body text-muted-foreground mb-8">
            اختر تجربتك الأولى وابدأ الاستكشاف
          </p>
          <Button
            size="lg"
            className="font-ui bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-10 glow-gold"
            onClick={() => navigate("/mood")}
          >
            ابدأ الآن
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* ===== التذييل ===== */}
      <footer className="py-8 px-6 text-center border-t border-border/30 relative z-10">
        <p className="font-display text-sm text-muted-foreground/50">
          بيت القصيد — حيث يلتقي الشعر بالتقنية ✦
        </p>
      </footer>
    </div>
  );
};

export default Index;
