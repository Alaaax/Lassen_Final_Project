/**
 * OrnamentalDivider - فاصل زخرفي عربي
 */
const OrnamentalDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-3 my-8 ${className}`}>
    <div className="h-px flex-1 bg-gradient-to-l from-gold/50 to-transparent" />
    <span className="text-gold text-2xl font-display leading-none select-none">✦</span>
    <div className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" />
  </div>
);

export default OrnamentalDivider;
