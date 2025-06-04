import { Platform, Dimensions } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

import HomeScreen from "./HomeScreen"
import RoutesScreen from "./RoutesScreen"
import PacksScreen from "./PacksScreen"
import MapsScreen from "./MapsScreen"
import ProfileScreen from "./ProfileScreen"

const Tab = createBottomTabNavigator()
const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
const isTablet = screenWidth >= 768
const isSmallDevice = screenWidth < 375

export default function HomeNavigation() {
  const insets = useSafeAreaInsets()

  // Calculate responsive tab bar height
  const getTabBarHeight = () => {
    const baseHeight = isTablet ? 80 : isSmallDevice ? 65 : 70
    const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 16)
    return baseHeight + bottomPadding
  }

  // Calculate responsive icon size
  const getIconSize = () => {
    if (isTablet) return 28
    if (isSmallDevice) return 22
    return 24
  }

  // Calculate responsive font size
  const getFontSize = () => {
    if (isTablet) return 14
    if (isSmallDevice) return 11
    return 12
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: string
          const iconSize = getIconSize()

          switch (route.name) {
            case "Home":
              iconName = "home"
              break
            case "Routes":
              iconName = "route"
              break
            case "Packs":
              iconName = "group"
              break
            case "Maps":
              iconName = "map"
              break
            case "Profile":
              iconName = "person"
              break
            default:
              iconName = "circle"
          }

          return <MaterialIcons name={iconName} size={iconSize} color={color} />
        },
        tabBarActiveTintColor: "#f3631a",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopWidth: 1,
          borderTopColor: "#333",
          height: getTabBarHeight(),
          paddingTop: isTablet ? 12 : 8,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 16),
          paddingHorizontal: isTablet ? 20 : 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: getFontSize(),
          fontWeight: "500",
          marginTop: 4,
          marginBottom: isTablet ? 4 : 0,
        },
        tabBarItemStyle: {
          paddingVertical: isTablet ? 8 : 4,
          minHeight: 44, // Minimum touch target
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Routes" component={RoutesScreen} />
      <Tab.Screen name="Packs" component={PacksScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
