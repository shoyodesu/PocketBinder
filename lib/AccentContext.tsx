import React, { createContext, useContext, useEffect, useState } from 'react';
import { SettingsStore, subscribe } from './storage';
import { COLORS } from './theme';

const AccentContext = createContext<string>(COLORS.primary);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState(COLORS.primary);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const s = await SettingsStore.get();
      if (mounted) setAccent(s.accentColor || COLORS.primary);
    }
    load();
    const unsubscribe = subscribe('settings', load);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return <AccentContext.Provider value={accent}>{children}</AccentContext.Provider>;
}

// Use this instead of the static COLORS.primary anywhere the app's brand
// color needs to reflect the user's chosen accent (buttons, FAB, selected
// states, tab bar). Decorative palette colors (yellow/green/etc tags) stay
// as fixed constants from theme.ts.
export function useAccent(): string {
  return useContext(AccentContext);
}
