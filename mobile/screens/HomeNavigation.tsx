import React from 'react';

import { styles } from '../styles/HomeNavigation.styles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PRIMARY_APP_COLOR } from '../config';
import { PlatformPressable } from '@react-navigation/elements'

const Tab = createBottomTabNavigator();


import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import PacksScreen from './PacksScreen';
import RoutesScreen from './RoutesScreen';
import DrivingDirectionsScreen from './DrivingDirectionsScreen';


import {
    Home,
    UsersRound,
    Map,
    Car,
    UserCircle2
} from "lucide-react-native"



export default function HomeNavigation() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom || 0 }]}>


            <Tab.Navigator
                screenOptions={{
                    tabBarButton: (props) => (<PlatformPressable {...props} android_ripple={{ color: 'transparent' }} />),
                    tabBarStyle: {
                        backgroundColor: '#111',
                        paddingBottom: insets.bottom || 12,
                        height: 70,
                        borderTopWidth: 0,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        position: 'absolute',
                    },
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: PRIMARY_APP_COLOR,
                    tabBarInactiveTintColor: '#fff',
                    headerShown: false,
                    tabBarIconStyle: {
                        marginTop: 14,
                    },
                }}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={HomeScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Home size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Packs"
                    component={PacksScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <UsersRound size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Routes"
                    component={RoutesScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Map size={size} color={color} />
                        ),
                    }}
                />
                {/* Disabled due to API limitations */}
                {/* <Tab.Screen
                    name="Drive"
                    component={DrivingDirectionsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Car size={size} color={color} />
                        ),
                    }}
                /> */}
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <UserCircle2 size={size} color={color} />
                        ),
                    }}
                />
            </Tab.Navigator>


        </SafeAreaView>
    );
}




