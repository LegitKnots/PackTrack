import { View } from "react-native"
import { styles } from "../styles/HomeNavigation.styles"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { PRIMARY_APP_COLOR } from "../config"
import { PlatformPressable } from "@react-navigation/elements"

const Tab = createBottomTabNavigator()

import HomeScreen from "./HomeScreen"
import ProfileScreen from "./ProfileScreen"
import PacksScreen from "./PacksScreen"
import RoutesScreen from "./RoutesScreen"

import { Home, UsersRound, Map, UserCircle2 } from "lucide-react-native"

export default function HomeNavigation() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarButton: (props) => <PlatformPressable {...props} android_ripple={{ color: "transparent" }} />,
          tabBarStyle: {
            backgroundColor: "#111",
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 12,
            height: 60 + Math.max(insets.bottom, 8),
            borderTopWidth: 0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 10,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: PRIMARY_APP_COLOR,
          tabBarInactiveTintColor: "#888",
          headerShown: false,
          tabBarIconStyle: {
            marginTop: 0,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Home size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Packs"
          component={PacksScreen}
          options={{
            tabBarIcon: ({ color, size }) => <UsersRound size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Routes"
          component={RoutesScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Map size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => <UserCircle2 size={24} color={color} />,
          }}
        />
      </Tab.Navigator>
    </View>
  )
}
