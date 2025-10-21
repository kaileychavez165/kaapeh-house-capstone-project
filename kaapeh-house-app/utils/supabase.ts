import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!');
}

// Custom storage implementation that respects "Remember Me" setting
class RememberMeStorage {
  private memoryStorage: { [key: string]: string } = {};
  private shouldPersist: boolean = true;

  setShouldPersist(shouldPersist: boolean) {
    console.log('🔐 Setting remember me to:', shouldPersist);
    this.shouldPersist = shouldPersist;
    // If we're switching to non-persistent, clear any existing persistent data
    if (!shouldPersist) {
      this.clearPersistentData();
    }
  }

  private async clearPersistentData() {
    try {
      console.log('🧹 Clearing persistent auth data');
      if (supabaseUrl) {
        await AsyncStorage.multiRemove([
          'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token',
          'supabase.auth.token'
        ]);
      }
    } catch (error) {
      console.log('Error clearing persistent auth data:', error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (this.shouldPersist) {
      const value = await AsyncStorage.getItem(key);
      console.log('📖 Reading from persistent storage:', key, value ? 'exists' : 'null');
      return value;
    } else {
      const value = this.memoryStorage[key] || null;
      console.log('📖 Reading from memory storage:', key, value ? 'exists' : 'null');
      return value;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.shouldPersist) {
      console.log('💾 Storing in persistent storage:', key);
      await AsyncStorage.setItem(key, value);
    } else {
      console.log('💾 Storing in memory storage:', key);
      this.memoryStorage[key] = value;
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.shouldPersist) {
      console.log('🗑️ Removing from persistent storage:', key);
      await AsyncStorage.removeItem(key);
    } else {
      console.log('🗑️ Removing from memory storage:', key);
      delete this.memoryStorage[key];
    }
  }
}

// Create storage instance
const rememberMeStorage = new RememberMeStorage();

// Global variable to track remember me preference
let globalRememberMe = true;
console.log('🔐 Initial globalRememberMe set to:', globalRememberMe);

// Export function to control persistence
export const setRememberMe = (shouldRemember: boolean) => {
  console.log('🔐 setRememberMe called with:', shouldRemember);
  globalRememberMe = shouldRemember;
  rememberMeStorage.setShouldPersist(shouldRemember);
  console.log('🔐 globalRememberMe is now:', globalRememberMe);
};

// Export function to get current remember me state
export const getRememberMe = () => {
  console.log('🔐 getRememberMe called, returning:', globalRememberMe);
  return globalRememberMe;
};

// Export function to clear session when app is closed (for non-remember me users)
export const clearSessionOnAppClose = async () => {
  try {
    console.log('🚪 App closing, clearing session for non-remember me users');
    await supabase.auth.signOut();
  } catch (error) {
    console.log('Error clearing session on app close:', error);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rememberMeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
