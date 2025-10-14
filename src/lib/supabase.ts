import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Проверка конфигурации
console.log('🔧 Supabase Config:', {
  url: supabaseUrl?.substring(0, 20) + '...',
  key: supabaseAnonKey?.substring(0, 10) + '...',
  hasRealConfig: !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder')
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    fetch: (...args) => {
      console.log('🌐 Supabase Fetch:', {
        url: args[0],
        method: args[1]?.method || 'GET',
        timestamp: new Date().toISOString()
      });
      
      // Добавляем таймаут к fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд
      
      const fetchOptions = {
        ...args[1],
        signal: controller.signal
      };
      
      return fetch(args[0], fetchOptions)
        .then(response => {
          clearTimeout(timeoutId);
          console.log('📨 Supabase Response:', {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
          return response;
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('❌ Supabase Fetch Error:', error);
          throw error;
        });
    }
  },
  db: {
    schema: 'public'
  }
});