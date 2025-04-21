import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from '../config';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
} from 'react-native';

import { styles } from '../styles/Landing.styles';
import { useNavigation } from '@react-navigation/native';
import { LandingScreenNavProp } from '../types/navigation';

const logo = require('../src/img/logo.png');

export default function Landing() {
    const navigation = useNavigation<LandingScreenNavProp>();

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('userId');

            if (!token || !userId) return;

            try {
                const res = await fetch(`${SERVER_URI}/api/users/${userId}/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    navigation.navigate('HomeNavigation');
                }
            } catch (err) {
                console.warn('Auto-login failed:', err);
            }
        };

        checkToken();
    }, []);





    return (
        <View style={styles.container}>
            <Text style={styles.title}>PackTrack</Text>
            <Image source={logo} style={styles.landingIcon} />
            <Text style={styles.subtitle}>Every ride, in sync.</Text>

            <View style={styles.btnsView}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginBtn}>
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupBtn}>
                    <Text style={styles.signupText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}