import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://iuiiixsdrkayldssigmp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aWlpeHNkcmtheWxkc3NpZ21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODgyODIsImV4cCI6MjA5Njc2NDI4Mn0.RWBGthCm1kjCamcnFWnznx78NeD_w-fbulk_J3DHii0';

// Web uses localStorage, native uses AsyncStorage
const storage =
  Platform.OS === 'web'
    ? undefined // supabase-js uses localStorage automatically on web
    : {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      };

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Exported for convenience
export { SUPABASE_URL };
