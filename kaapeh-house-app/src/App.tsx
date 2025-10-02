import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Navigation } from './navigation';
import AccountScreen from './navigation/screens/Account';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // You can return a loading screen here if needed
    return null;
  }

  // If user is authenticated, show Account screen
  if (session) {
    return <AccountScreen session={session} />;
  }

  // Otherwise show the normal navigation flow
  return <Navigation />;
}
