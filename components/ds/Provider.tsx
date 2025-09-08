'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type RadiusScale = 'md' | 'xl' | '3xl';
type Density = 'comfortable' | 'compact';

interface DSContextValue {
  radiusScale: RadiusScale;
  setRadiusScale: (scale: RadiusScale) => void;
  density: Density;
  setDensity: (density: Density) => void;
}

const DSContext = createContext<DSContextValue | null>(null);

export function DSProvider({ children }: { children: React.ReactNode }) {
  const [radiusScale, setRadiusScale] = useState<RadiusScale>('3xl');
  const [density, setDensity] = useState<Density>('comfortable');

  const handleSetRadiusScale = useCallback((scale: RadiusScale) => {
    setRadiusScale(scale);
  }, []);

  const handleSetDensity = useCallback((density: Density) => {
    setDensity(density);
  }, []);

  return (
    <DSContext.Provider
      value={{
        radiusScale,
        setRadiusScale: handleSetRadiusScale,
        density,
        setDensity: handleSetDensity,
      }}
    >
      {children}
    </DSContext.Provider>
  );
}

export function useDS() {
  const context = useContext(DSContext);
  if (!context) {
    throw new Error('useDS must be used within DSProvider');
  }
  return context;
}
