import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import SplashScreen from './screens/Splash';
import WelcomeScreen from './screens/Welcome';
import AuthScreen from './screens/Auth';
import HomeScreen from './screens/Home';
import AccountScreen from './screens/Account';
import AdminHomeScreen from './screens/AdminHome';
import CustomerPortalScreen from './screens/CustomerPortal';
import { supabase } from '../../utils/supabase';

interface NavigationProps {
  session: Session | null;
}

const Stack = createNativeStackNavigator();

export const Navigation: React.FC<NavigationProps> = ({ session }) => {
  const navigationRef = useRef<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Add a delay on initial load to allow splash screen to show
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 3000); // Slightly longer than splash screen duration

    return () => clearTimeout(timer);
  }, []);

  // Fetch user role when session changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user role:', error);
            setUserRole('customer'); // Default to customer on error
          } else {
            console.log('👤 User role:', data?.role);
            setUserRole(data?.role || 'customer');
          }
        } catch (error) {
          console.error('Error in fetchUserRole:', error);
          setUserRole('customer');
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [session]);

  // Only handle navigation after initial load delay
  useEffect(() => {
    if (navigationRef.current && !isInitialLoad) {
      if (session && userRole) {
        if (userRole === 'admin') {
          console.log('🔄 Admin session detected, navigating to AdminHome');
          navigationRef.current.navigate('AdminHome');
        } else {
          console.log('🔄 Session detected, navigating to Home');
          navigationRef.current.navigate('Home');
        }
      } else if (!session) {
        console.log('🔄 No session, navigating to Welcome');
        navigationRef.current.navigate('Welcome');
      }
    }
  }, [session, userRole, isInitialLoad]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ 
          headerShown: false,
          animation: 'none',
          animationTypeForReplace: 'pop',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Home">
          {() => session ? <HomeScreen session={session} /> : <HomeScreen session={null} />}
        </Stack.Screen>
        <Stack.Screen name="AdminHome">
          {() => session ? <AdminHomeScreen /> : null}
        </Stack.Screen>
        <Stack.Screen name="CustomerPortal">
          {() => session ? <CustomerPortalScreen /> : null}
        </Stack.Screen>
        <Stack.Screen name="Account">
          {() => session ? <AccountScreen session={session} /> : null}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
