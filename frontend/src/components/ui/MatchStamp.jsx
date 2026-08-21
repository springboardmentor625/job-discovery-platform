import { motion } from 'framer-motion';

/**
 * The recurring "passport stamp" motif used on job cards, resume analysis,
 * and dashboard highlights. size: 'sm' | 'md' | 'lg'
 */
export default function MatchStamp({ percentage = 0, size = 'md' }) {
  const tone = percentage >= 80 ? 'teal' : percentage >= 60 ? 'gold' : 'coral';

  const sizes = {
    sm: { box: 'w-14 h-14', num: 'text-lg', label: 'text-[7px]' },
    md: { box: 'w-20 h-20', num: 'text-2xl', label: 'text-[9px]' },
    lg: { box: 'w-32 h-32', num: 'text-4xl', label: 'text-xs' },
  }[size];

  const toneClasses = {
    teal: 'border-teal text-teal',
    gold: 'border-gold text-gold',
    coral: 'border-coral text-coral',
  }[tone];

  return (
    <motion.div
      initial={{ scale: 0.4, rotate: -18, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      className={`${sizes.box} rounded-full border-4 ${toneClasses} flex flex-col items-center justify-center bg-dossier/5 backdrop-blur-sm select-none`}
      style={{ borderStyle: 'double' }}
      aria-label={`Match score ${percentage} percent`}
    >
      <span className={`font-display font-bold leading-none ${sizes.num}`}>{percentage}%</span>
      <span className={`font-mono tracking-widest uppercase ${sizes.label} mt-0.5`}>Match</span>
    </motion.div>
  );
}
