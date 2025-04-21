import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  HomeNavigation: undefined;
  CompleteProfile: { userId: string; token: string };
  Packs: undefined,
  Routes: undefined,
  Drive: undefined,
};

export type LandingScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;
