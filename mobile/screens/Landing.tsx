import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URI } from '../config';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { LandingScreenNavProp } from '../types/navigation';

const logo = require('../src/img/logo.png');
const { width } = Dimensions.get('window');

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
                    navigation.navigate('Home');
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


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#f3631a',
        marginBottom: 10,
    },
    landingIcon: {
        width: width * 0.5,
        height: width * 0.5,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 20,
        color: '#aaaaaa',
        marginBottom: 25,
        textAlign: 'center',
    },
    btnsView: {
        marginTop: 100,
    },
    loginBtn: {
        backgroundColor: '#f3631a',
        paddingVertical: 15,
        width: width * 0.65,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    loginText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    signupBtn: {
        backgroundColor: '#2e2e2e',
        paddingVertical: 15,
        width: width * 0.65,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    signupText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
