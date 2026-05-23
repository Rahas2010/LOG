import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ThemeMode = 'classic' | 'glass';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'glass', toggleTheme: () => {} });

function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('screentime_theme');
    if (saved === 'classic' || saved === 'glass') return saved;
  } catch {}
  return 'glass';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'glass' ? 'classic' : 'glass';
      try { localStorage.setItem('screentime_theme', next); } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
