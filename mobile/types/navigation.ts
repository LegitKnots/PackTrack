import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { PackDetails } from "./Pack"

export type RootStackParamList = {
  Landing: undefined
  Login: undefined
  Signup: undefined
  HomeNavigation: undefined
  Dashboard: undefined
  CompleteProfile: { userId: string; token: string }
  Packs: undefined
  Routes: undefined
  Drive: undefined
  RouteDetails: { route: RouteType }
  EditRoute: { route: RouteType }
  PackDetails: { pack: PackDetails }
  PackMembers: { packId: string }
  PackSettings: { pack: PackDetails }
  PackChat: { packId: string }
  Notifications: undefined
  Settings: undefined
  AccountSettings: undefined
  AppearanceSettings: undefined
  PersonalizationSettings: undefined
  PrivacySettings: undefined
  NotificationSettings: undefined
  EditProfile: undefined
}

export type RouteType = {
  _id?: string
  id?: string
  name: string
  description?: string
  waypoints: Array<{
    label: string
    lat: number
    lng: number
    order: number
  }>
  distance: string | number
  createdBy: string
  collaborators?: string[]
  visibility?: "private" | "public"
  isShared: boolean
  shareCode: string
}

// Navigation prop types
export type PackDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PackDetails">
export type PackDetailsScreenRouteProp = RouteProp<RootStackParamList, "PackDetails">

export type PackMembersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PackMembers">
export type PackMembersScreenRouteProp = RouteProp<RootStackParamList, "PackMembers">

export type PackSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PackSettings">
export type PackSettingsScreenRouteProp = RouteProp<RootStackParamList, "PackSettings">

export type PacksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export type RouteDetailsScreenProps = NativeStackScreenProps<RootStackParamList, "RouteDetails">
export type EditRouteScreenProps = NativeStackScreenProps<RootStackParamList, "EditRoute">

export type RouteDetailsRouteProp = RouteProp<RootStackParamList, "RouteDetails">
export type EditRouteRouteProp = RouteProp<RootStackParamList, "EditRoute">

export type LandingScreenNavProp = NativeStackNavigationProp<RootStackParamList, "Landing">
