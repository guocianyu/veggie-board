'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type PriceMode = 'wholesale' | 'retail';

type Ctx = { 
  mode: PriceMode; 
  setMode: (m: PriceMode) => void;
};

const PriceModeCtx = createContext<Ctx | null>(null);
const KEY = 'vb_price_mode';

export function PriceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PriceMode>('retail');
  
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem(KEY) as PriceMode | null) : null;
    if (saved === 'wholesale' || saved === 'retail') {
      setModeState(saved);
    }
  }, []);
  
  const setMode = useCallback((m: PriceMode) => {
    setModeState(m);
    try { 
      localStorage.setItem(KEY, m); 
    } catch (e) {
      console.warn('Failed to save price mode to localStorage:', e);
    }
  }, []);
  
  return (
    <PriceModeCtx.Provider value={{ mode, setMode }}>
      {children}
    </PriceModeCtx.Provider>
  );
}

export function usePriceMode() {
  const ctx = useContext(PriceModeCtx);
  if (!ctx) {
    throw new Error('usePriceMode must be used within PriceModeProvider');
  }
  return ctx;
}
