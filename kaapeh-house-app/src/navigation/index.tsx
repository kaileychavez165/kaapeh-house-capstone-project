import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/Splash';
import WelcomeScreen from './screens/Welcome';
import AuthScreen from './screens/Auth';

const RootStack = createNativeStackNavigator({
  screens: {
    Splash: {
      screen: SplashScreen,
      options: {
        headerShown: false,
      },
    },
    Welcome: WelcomeScreen,
    Auth: {
      screen: AuthScreen,
      options: {
        headerShown: false,
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);
