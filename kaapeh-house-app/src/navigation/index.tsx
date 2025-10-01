import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/splash';
import HomeScreen from './screens/Home';
import LoggedInScreen from './screens/logged_in';
import SignUpScreen from './screens/sign_up';

const RootStack = createNativeStackNavigator({
  screens: {
    Splash: {
      screen: SplashScreen,
      options: {
        headerShown: false,
      },
    },
    Home: HomeScreen,
    LoggedIn: {
      screen: LoggedInScreen,
      options: {
        headerShown: false,
      },
    },
    SignUp: {
      screen: SignUpScreen,
      options: {
        headerShown: false,
      },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);
