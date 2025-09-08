'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColorPreference } from '@/types';

// 預設 UI 偏好設定
const DEFAULT_PREFS = {
  colorPreference: 'red-up' as ColorPreference,
  theme: 'light' as 'light' | 'dark',
  fontSize: 'medium' as 'small' | 'medium' | 'large',
  showRetailEstimate: true,
  chartAnimation: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 秒
} as const;

// 本地儲存鍵值
const STORAGE_KEY = 'veggie-board-ui-prefs';

// UI 偏好設定型別
export type UIPreferences = typeof DEFAULT_PREFS;

/**
 * 從 localStorage 讀取偏好設定
 */
function loadPreferences(): UIPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch (error) {
    console.warn('無法讀取 UI 偏好設定:', error);
  }

  return DEFAULT_PREFS;
}

/**
 * 儲存偏好設定到 localStorage
 */
function savePreferences(prefs: UIPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('無法儲存 UI 偏好設定:', error);
  }
}

/**
 * UI 偏好設定 Hook
 */
export function useUIPreferences() {
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFS);
  const [isLoaded, setIsLoaded] = useState(false);

  // 載入偏好設定
  useEffect(() => {
    const prefs = loadPreferences();
    setPreferences(prefs);
    setIsLoaded(true);
  }, []);

  // 更新偏好設定
  const updatePreference = useCallback(<K extends keyof UIPreferences>(
    key: K,
    value: UIPreferences[K] | boolean | number
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value as UIPreferences[K] };
      savePreferences(updated);
      return updated;
    });
  }, []);

  // 重置偏好設定
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFS);
    savePreferences(DEFAULT_PREFS);
  }, []);

  // 批次更新偏好設定
  const updatePreferences = useCallback((updates: Partial<UIPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      savePreferences(updated);
      return updated;
    });
  }, []);

  return {
    preferences,
    isLoaded,
    updatePreference,
    updatePreferences,
    resetPreferences,
  };
}

/**
 * 顏色偏好設定 Hook
 */
export function useColorPreference() {
  const { preferences, updatePreference } = useUIPreferences();
  
  const toggleColorPreference = useCallback(() => {
    const newPreference = preferences.colorPreference === 'red-up' ? 'green-up' : 'red-up';
    updatePreference('colorPreference', newPreference);
  }, [preferences.colorPreference, updatePreference]);

  return {
    colorPreference: preferences.colorPreference,
    toggleColorPreference,
    isRedUp: preferences.colorPreference === 'red-up',
    isGreenUp: preferences.colorPreference === 'green-up',
  };
}

/**
 * 主題設定 Hook
 */
export function useTheme() {
  const { preferences, updatePreference } = useUIPreferences();
  
  const toggleTheme = useCallback(() => {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    updatePreference('theme', newTheme);
  }, [preferences.theme, updatePreference]);

  return {
    theme: preferences.theme,
    toggleTheme,
    isLight: preferences.theme === 'light',
    isDark: preferences.theme === 'dark',
  };
}

/**
 * 字體大小設定 Hook
 */
export function useFontSize() {
  const { preferences, updatePreference } = useUIPreferences();
  
  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    updatePreference('fontSize', size);
  }, [updatePreference]);

  const increaseFontSize = useCallback(() => {
    const sizes = ['small', 'medium', 'large'] as const;
    const currentIndex = sizes.indexOf(preferences.fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  }, [preferences.fontSize, setFontSize]);

  const decreaseFontSize = useCallback(() => {
    const sizes = ['small', 'medium', 'large'] as const;
    const currentIndex = sizes.indexOf(preferences.fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  }, [preferences.fontSize, setFontSize]);

  return {
    fontSize: preferences.fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    isSmall: preferences.fontSize === 'small',
    isMedium: preferences.fontSize === 'medium',
    isLarge: preferences.fontSize === 'large',
  };
}

/**
 * 圖表設定 Hook
 */
export function useChartSettings() {
  const { preferences, updatePreference } = useUIPreferences();
  
  const toggleRetailEstimate = useCallback(() => {
    updatePreference('showRetailEstimate', !preferences.showRetailEstimate);
  }, [preferences.showRetailEstimate, updatePreference]);

  const toggleAnimation = useCallback(() => {
    updatePreference('chartAnimation', !preferences.chartAnimation);
  }, [preferences.chartAnimation, updatePreference]);

  return {
    showRetailEstimate: preferences.showRetailEstimate,
    chartAnimation: preferences.chartAnimation,
    toggleRetailEstimate,
    toggleAnimation,
  };
}

/**
 * 自動重新整理設定 Hook
 */
export function useAutoRefresh() {
  const { preferences, updatePreference } = useUIPreferences();
  
  const toggleAutoRefresh = useCallback(() => {
    updatePreference('autoRefresh', !preferences.autoRefresh);
  }, [preferences.autoRefresh, updatePreference]);

  const setRefreshInterval = useCallback((interval: number) => {
    updatePreference('refreshInterval', interval);
  }, [updatePreference]);

  return {
    autoRefresh: preferences.autoRefresh,
    refreshInterval: preferences.refreshInterval,
    toggleAutoRefresh,
    setRefreshInterval,
  };
}

/**
 * 取得字體大小的 CSS 類別
 */
export function getFontSizeClass(fontSize: UIPreferences['fontSize']): string {
  const classes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };
  
  return classes[fontSize];
}

/**
 * 取得主題的 CSS 類別
 */
export function getThemeClass(theme: UIPreferences['theme']): string {
  return theme === 'dark' ? 'dark' : '';
}

/**
 * 檢查是否支援本地儲存
 */
export function isLocalStorageSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 匯出偏好設定
 */
export function exportPreferences(preferences: UIPreferences): string {
  return JSON.stringify(preferences, null, 2);
}

/**
 * 匯入偏好設定
 */
export function importPreferences(jsonString: string): UIPreferences | null {
  try {
    const parsed = JSON.parse(jsonString);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return null;
  }
}
