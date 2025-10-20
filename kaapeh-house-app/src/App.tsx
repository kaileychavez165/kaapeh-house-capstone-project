import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { Navigation } from './navigation';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingResetPassword, setPendingResetPassword] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle deep links for password reset
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      
      // Parse the URL to extract query parameters
      const { queryParams } = Linking.parse(event.url);
      
      if (queryParams?.type === 'recovery') {
        console.log('🔄 Password reset link detected');
        console.log('🔗 Query params:', queryParams);
        // Store the reset password parameters to pass to Navigation
        setPendingResetPassword(queryParams);
      }
    };

    // Listen for incoming links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription?.remove();
  }, []);

  if (loading) {
    // You can return a loading screen here if needed
    return null;
  }

  // Always use Navigation component, pass session and pending reset password as parameters
  return (
    <Navigation 
      session={session} 
      pendingResetPassword={pendingResetPassword}
      onClearPendingResetPassword={() => setPendingResetPassword(null)}
    />
  );
}
