'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestPage() {
  useEffect(() => {
    const testSupabaseConnection = async () => {
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vegetables')
          .select('*');

        console.log('Supabase connection test results:');
        console.log('Data:', data);
        console.log('Error:', error);
      } catch (err) {
        console.error('Failed to fetch from vegetables table:', err);
      }
    };

    testSupabaseConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Testing Supabase Connection
        </h1>
        <p className="text-gray-600">
          Open console to see results
        </p>
      </div>
    </div>
  );
}
