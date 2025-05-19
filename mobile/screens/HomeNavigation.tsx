import React from 'react';

import { styles } from '../styles/HomeNavigation.styles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PRIMARY_APP_COLOR } from '../config';


const Tab = createBottomTabNavigator();


import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import PacksScreen from './PacksScreen';
import RoutesScreen from './RoutesScreen';
import DrivingDirectionsScreen from './DrivingDirectionsScreen';



export default function HomeNavigation() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom || 0 }]}>


            <Tab.Navigator
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: '#111',
                        paddingBottom: insets.bottom || 12,
                        height: 70,
                        borderTopWidth: 0,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        position: 'absolute',
                    },
                    tabBarActiveTintColor: PRIMARY_APP_COLOR,
                    tabBarInactiveTintColor: '#fff',
                    headerShown: false,
                }}
            >
                <Tab.Screen name="Dashboard" component={HomeScreen} />
                <Tab.Screen name="Packs" component={PacksScreen} />
                <Tab.Screen name="Routes" component={RoutesScreen} />
                <Tab.Screen name="Drive" component={DrivingDirectionsScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>


        </SafeAreaView>
    );
}




