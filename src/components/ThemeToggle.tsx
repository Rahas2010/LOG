import { motion } from 'framer-motion';
import { Layers, Sparkles, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  const config = {
    glass:   { icon: Sparkles, bg: 'linear-gradient(135deg, #e8e0f0, #d8d0e8)', color: 'text-purple-500', label: 'Glass' },
    classic: { icon: Layers,   bg: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)', color: 'text-gray-700',   label: 'Classic' },
    dark:    { icon: Moon,     bg: 'linear-gradient(135deg, #2d2d3a, #1a1a2e)', color: 'text-indigo-400',  label: 'Dark' },
  };

  const c = config[theme];
  const Icon = c.icon;

  return (
    <button
      onClick={cycleTheme}
      className="relative flex items-center rounded-full cursor-pointer overflow-hidden gap-1.5 pr-2.5"
      style={{
        background: c.bg,
        height: '34px',
        padding: '4px',
      }}
      title={`Theme: ${c.label} — click to switch`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative flex items-center justify-center rounded-full bg-white shadow-md"
        style={{ width: '26px', height: '26px' }}
      >
        <Icon className={`w-3 h-3 ${c.color}`} />
      </motion.div>
      <span className={`text-[9px] font-bold uppercase tracking-wide ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
      }`}>
        {c.label}
      </span>
    </button>
  );
}
