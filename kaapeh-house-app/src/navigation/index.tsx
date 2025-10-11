import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    // Navigate to Home when session becomes available
    if (session && navigationRef.current) {
      console.log('🔄 Session detected, navigating to Home');
      navigationRef.current.navigate('Home');
    }
  }, [session]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen 
          name="Home" 
          component={() => session ? <HomeScreen session={session} /> : <HomeScreen session={null} />} 
        />
        <Stack.Screen 
          name="Account" 
          component={() => session ? <AccountScreen session={session} /> : null} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
