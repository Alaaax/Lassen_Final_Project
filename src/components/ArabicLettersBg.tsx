/**
 * ArabicLettersBg - خلفية حروف عربية متحركة
 */
import { motion } from "framer-motion";

const letters = ["ب", "ت", "ش", "ع", "ق", "ن", "م", "و", "ي", "ل", "ك", "ه", "د", "ر", "ص"];

const ArabicLettersBg = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.04]">
    {letters.map((letter, i) => (
      <motion.span
        key={i}
        className="absolute font-display text-foreground select-none"
        style={{
          fontSize: `${40 + Math.random() * 60}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{ y: [0, -15, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{
          duration: 8 + Math.random() * 6,
          repeat: Infinity,
          delay: Math.random() * 4,
          ease: "easeInOut",
        }}
      >
        {letter}
      </motion.span>
    ))}
  </div>
);

export default ArabicLettersBg;
