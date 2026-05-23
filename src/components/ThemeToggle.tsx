import { motion } from 'framer-motion';
import { Layers, Sparkles } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isGlass = theme === 'glass';

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center rounded-full cursor-pointer overflow-hidden"
      style={{
        background: isGlass
          ? 'linear-gradient(135deg, #e8e0f0, #d8d0e8)'
          : 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
        width: '72px',
        height: '34px',
        padding: '4px',
      }}
      title={`Switch to ${isGlass ? 'Classic' : 'Glass'} theme`}
    >
      {/* Labels */}
      <span className={`absolute left-2.5 text-[9px] font-bold uppercase tracking-wide transition-opacity duration-300 ${
        isGlass ? 'opacity-0' : 'opacity-50'
      }`}>A</span>
      <span className={`absolute right-2.5 text-[9px] font-bold uppercase tracking-wide transition-opacity duration-300 ${
        isGlass ? 'opacity-50' : 'opacity-0'
      }`}>B</span>

      {/* Knob */}
      <motion.div
        animate={{ x: isGlass ? 0 : 38 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative flex items-center justify-center rounded-full bg-white shadow-md"
        style={{ width: '26px', height: '26px' }}
      >
        {isGlass ? (
          <Sparkles className="w-3 h-3 text-purple-500" />
        ) : (
          <Layers className="w-3 h-3 text-gray-700" />
        )}
      </motion.div>
    </button>
  );
}
