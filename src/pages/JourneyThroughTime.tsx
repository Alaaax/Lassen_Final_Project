/**
 * صفحة رحلة عبر الزمن - Journey Through Time
 * رحلة تفاعلية: بداية -> الجاهلي -> العباسي -> الحديث -> خلاصة نهائية
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/PageLayout";
import ArabicLettersBg from "@/components/ArabicLettersBg";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useHistory } from "@/contexts/HistoryContext";
import { APIError, getTimeJourney, type JourneyResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const themes = ["غزل", "مدح", "ذم", "هجاء", "حزن"] as const;

const eraColors = ["bg-amber-500/20", "bg-emerald-500/20", "bg-rose-500/20"];

const JourneyThroughTime = () => {
  const [selectedTheme, setSelectedTheme] = useState("");
  const [journeyData, setJourneyData] = useState<JourneyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { addHistoryItem } = useHistory();
  const { toast } = useToast();

  const maxStep = useMemo(() => {
    if (!journeyData) return 0;
    return journeyData.eras.length + 1; // 0 بداية، 1..n عصور، n+1 خلاصة
  }, [journeyData]);

  const handleExplore = async (theme: string) => {
    setSelectedTheme(theme);
    setIsLoading(true);
    setJourneyData(null);
    setCurrentStep(0);
    addHistoryItem("journey", "رحلة عبر الزمن", theme);
    try {
      const data = await getTimeJourney(theme);
      setJourneyData(data);
      setCurrentStep(0);
    } catch (error) {
      const message =
        error instanceof APIError
          ? error.message
          : "تعذر بدء الرحلة الآن. حاول مرة أخرى.";
      toast({
        title: "تعذر تحميل الرحلة",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const isIntroStep = currentStep === 0;
  const isSummaryStep = journeyData ? currentStep === journeyData.eras.length + 1 : false;
  const currentEra = journeyData && !isIntroStep && !isSummaryStep
    ? journeyData.eras[currentStep - 1]
    : null;

  return (
    <PageLayout title="رحلة عبر الزمن">
      <div className="relative min-h-[calc(100vh-3.5rem)] p-6">
        <ArabicLettersBg />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <Clock className="h-10 w-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl text-foreground mb-2">رحلة عبر الزمن</h2>
            <p className="font-body text-muted-foreground">اختر موضوعاً وشاهد كيف عبّر عنه الشعراء عبر العصور</p>
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

          {/* الرحلة التفاعلية */}
          <AnimatePresence>
            {journeyData && !isLoading && (
              <motion.div
                key={`${selectedTheme}-${currentStep}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <OrnamentalDivider />

                {/* شريط التقدم */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {Array.from({ length: maxStep + 1 }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-10 rounded-full transition-colors ${
                        idx <= currentStep ? "bg-gold" : "bg-gold/20"
                      }`}
                    />
                  ))}
                </div>

                {/* شاشة البداية */}
                {isIntroStep && (
                  <div className="glass-card p-8 text-center bg-card/85">
                    <p className="font-display text-2xl text-foreground mb-3"> بداية الرحلة</p>
                    <p className="font-body text-muted-foreground leading-loose">
                      {journeyData.intro_line}
                    </p>
                    <p className="font-ui text-xs text-muted-foreground/80 mt-3">
                      اضغط السهم للانتقال إلى أول عصر.
                    </p>
                  </div>
                )}

                {/* شاشة العصر الحالي */}
                {currentEra && (
                  <div className={`glass-card p-6 ${eraColors[(currentStep - 1) % eraColors.length]}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="font-display text-2xl text-foreground">{currentEra.era_label}</span>
                    </div>

                    <p className="font-ui text-xs text-muted-foreground mb-4">
                      {currentEra.poet_name || "غير معروف"}
                    </p>

                    <div className="space-y-2">
                      {currentEra.verses.map((verse, idx) => (
                        <blockquote
                          key={`${currentEra.era_key}-${idx}`}
                          className="font-display text-lg text-foreground/90 border-r-2 border-gold/40 pr-3 leading-loose"
                        >
                          {verse}
                        </blockquote>
                      ))}
                    </div>

                    {currentEra.fallback_used && (
                      <p className="font-ui text-xs text-amber-700 mt-4">
                        ملاحظة: لم تتوفر قصيدة مصنفة مباشرة بنفس الموضوع في هذا العصر، فتم اختيار قصيدة من نفس العصر.
                      </p>
                    )}
                  </div>
                )}

                {/* شاشة النهاية */}
                {isSummaryStep && (
                  <div className="glass-card p-8 bg-card/90">
                    <p className="font-display text-2xl text-foreground mb-4 text-center">
                      نهاية الرحلة عبر الزمن
                    </p>
                    <div className="mb-5">
                      <p className="font-ui text-sm text-muted-foreground mb-2">أوجه التشابه:</p>
                      <ul className="list-disc list-inside space-y-1 font-body text-foreground/90">
                        {journeyData.summary.similarities.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-5">
                      <p className="font-ui text-sm text-muted-foreground mb-2">الاختلاف الجوهري:</p>
                      <p className="font-body text-foreground/90 leading-loose">
                        {journeyData.summary.core_difference}
                      </p>
                    </div>
                    <p className="font-display text-lg text-gold-dark text-center">
                      {journeyData.summary.final_line}
                    </p>

                    {journeyData.warnings.length > 0 && (
                      <div className="mt-6 p-3 rounded-lg bg-gold/10 border border-gold/25">
                        <p className="font-ui text-xs text-muted-foreground mb-1">ملاحظات البيانات:</p>
                        <ul className="list-disc list-inside space-y-1 font-ui text-xs text-muted-foreground">
                          {journeyData.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* أزرار التنقل */}
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    className="border-gold/30 hover:bg-gold/10"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ArrowRight className="h-4 w-4 ml-1" />
                    السابق
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={nextStep}
                    disabled={currentStep >= maxStep}
                  >
                    التالي
                    <ArrowLeft className="h-4 w-4 mr-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* الحالة الفارغة */}
          {!selectedTheme && !isLoading && !journeyData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Sparkles className="h-16 w-16 text-gold/30 mx-auto mb-4" />
              <p className="font-body text-muted-foreground/50">اختر موضوعاً لتبدأ الرحلة</p>
            </motion.div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default JourneyThroughTime;
