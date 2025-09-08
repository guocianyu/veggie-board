'use client';

import { useChartSettings } from '@/lib/ui-prefs';
import { Button } from '@/components/ds/Button';

export default function RetailToggle() {
  const { showRetailEstimate, toggleRetailEstimate } = useChartSettings();

  return (
    <Button
      tone="ghost"
      size="sm"
      onClick={toggleRetailEstimate}
      className="flex items-center space-x-2"
      title={`${showRetailEstimate ? '隱藏' : '顯示'}零售估算線`}
    >
      <div className={`w-2 h-2 rounded-full ${showRetailEstimate ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
      <span className="text-xs">
        {showRetailEstimate ? '隱藏估算' : '顯示估算'}
      </span>
    </Button>
  );
}
