import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Landing: undefined;
    Login: undefined;
    Signup: undefined;
  };

  export type LandingScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;
