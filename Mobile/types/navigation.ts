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
  // RouteDetails: {route: RouteType;},
  RouteDetails: {route:any}
};

export type RouteType = {
  name: string;
  description?: string;
  waypoints: { label: string; latitude: number; longitude: number }[];
  distance: string;
  creator: string;
  collaborators: string[];
  polyline?: { latitude: number; longitude: number }[];
};

export type LandingScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;
