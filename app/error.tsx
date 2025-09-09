'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">發生錯誤</h2>
        <p className="text-muted mb-6">很抱歉，頁面載入時發生錯誤。</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-brandOrange text-white rounded-lg font-medium hover:bg-brandOrange/90 transition-colors"
        >
          重試
        </button>
      </div>
    </div>
  );
}

