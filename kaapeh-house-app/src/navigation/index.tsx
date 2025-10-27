import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import SplashScreen from './screens/Splash';
import WelcomeScreen from './screens/Welcome';
import AuthScreen from './screens/Auth';
import ForgotPasswordScreen from './screens/ForgotPassword';
import ResetPasswordScreen from './screens/ResetPassword';
import HomeScreen from './screens/Home';
import AccountScreen from './screens/Account';
import AdminHomeScreen from './screens/AdminHome';
import CustomerPortalScreen from './screens/CustomerPortal';
import MenuScreen from './screens/Menu';
import { supabase } from '../../utils/supabase';
import ChatBotScreen from './screens/ChatBot';
import DrinkDetailScreen from './screens/DrinkDetail';
import OrderDetailScreen from './screens/OrderDetail';

interface NavigationProps {
  session: Session | null;
  pendingResetPassword?: any;
  onClearPendingResetPassword?: () => void;
}

const Stack = createNativeStackNavigator();

export const Navigation: React.FC<NavigationProps> = ({ session, pendingResetPassword, onClearPendingResetPassword }) => {
  const navigationRef = useRef<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOnResetPasswordScreen, setIsOnResetPasswordScreen] = useState(false);

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

  // Handle pending reset password navigation
  useEffect(() => {
    if (navigationRef.current && pendingResetPassword && !isInitialLoad) {
      console.log('🔄 Navigating to ResetPassword with params:', pendingResetPassword);
      setIsOnResetPasswordScreen(true);
      navigationRef.current.navigate('ResetPassword', pendingResetPassword);
    }
  }, [pendingResetPassword, isInitialLoad]);

  // Clear pending reset password when user is authenticated AND not on reset password screen
  useEffect(() => {
    if (session && pendingResetPassword && onClearPendingResetPassword && !isOnResetPasswordScreen) {
      console.log('🔄 User authenticated, clearing pending reset password');
      onClearPendingResetPassword();
    }
  }, [session, pendingResetPassword, onClearPendingResetPassword, isOnResetPasswordScreen]);

  // Only handle navigation after initial load delay
  useEffect(() => {
    console.log('🔄 Navigation effect triggered:', { 
      hasNavigationRef: !!navigationRef.current, 
      isInitialLoad, 
      hasPendingReset: !!pendingResetPassword, 
      isOnResetPasswordScreen,
      hasSession: !!session, 
      userRole 
    });
    
    if (navigationRef.current && !isInitialLoad && !pendingResetPassword && !isOnResetPasswordScreen) {
      if (session && userRole) {
        if (userRole === 'admin') {
          console.log('🔄 Admin session detected, resetting navigation to AdminHome');
          // Reset navigation stack to prevent back navigation to Auth
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'AdminHome' }],
          });
        } else {
          console.log('🔄 Session detected, resetting navigation to Home');
          // Reset navigation stack to prevent back navigation to Auth
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      } else if (!session) {
        console.log('🔄 No session, resetting navigation to Welcome');
        // Reset navigation stack to prevent back navigation to authenticated screens
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }
  }, [session, userRole, isInitialLoad, pendingResetPassword, isOnResetPasswordScreen]);

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
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword">
          {() => <ResetPasswordScreen onPasswordResetComplete={() => setIsOnResetPasswordScreen(false)} />}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {() => session ? <HomeScreen session={session} /> : <HomeScreen session={null} />}
        </Stack.Screen>
        <Stack.Screen name="AdminHome">
          {() => session ? <AdminHomeScreen /> : null}
        </Stack.Screen>
        <Stack.Screen name="CustomerPortal">
          {() => session ? <CustomerPortalScreen /> : null}
        </Stack.Screen>
        <Stack.Screen name="Menu">
          {() => session ? <MenuScreen /> : null}
        </Stack.Screen>
        <Stack.Screen name="Account">
          {() => session ? <AccountScreen session={session} /> : null}
        </Stack.Screen>
        <Stack.Screen name="ChatBot">
          {() => <ChatBotScreen session={session} />}
        </Stack.Screen>
        <Stack.Screen name="DrinkDetail" component={DrinkDetailScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
