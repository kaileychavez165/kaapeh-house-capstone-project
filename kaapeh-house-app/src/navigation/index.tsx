import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import SplashScreen from './screens/Splash';
import WelcomeScreen from './screens/Welcome';
import AuthScreen from './screens/Auth';
import HomeScreen from './screens/Home';
import AccountScreen from './screens/Account';

interface NavigationProps {
  session: Session | null;
}

const Stack = createNativeStackNavigator();

export const Navigation: React.FC<NavigationProps> = ({ session }) => {
  const navigationRef = useRef<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add a delay on initial load to allow splash screen to show
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 3000); // Slightly longer than splash screen duration

    return () => clearTimeout(timer);
  }, []);

  // Only handle navigation after initial load delay
  useEffect(() => {
    if (navigationRef.current && !isInitialLoad) {
      if (session) {
        console.log('🔄 Session detected, navigating to Home');
        navigationRef.current.navigate('Home');
      } else {
        console.log('🔄 No session, navigating to Welcome');
        navigationRef.current.navigate('Welcome');
      }
    }
  }, [session, isInitialLoad]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home">
          {() => session ? <HomeScreen session={session} /> : <HomeScreen session={null} />}
        </Stack.Screen>
        <Stack.Screen name="Account">
          {() => session ? <AccountScreen session={session} /> : null}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
