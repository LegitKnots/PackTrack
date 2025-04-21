import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [fullName, setFullName] = useState('');
    const [scheduledRide, setScheduledRide] = useState<any>(null); // You can replace 'any' with a proper type

    useEffect(() => {
        const loadUserData = async () => {
            const name = await AsyncStorage.getItem('fullname');
            setFullName(name || 'Rider');

            // Placeholder ride object – replace this with a real fetch call
            const mockRide = {
                from: 'BP - Pleasant Hill Rd',
                to: "Mazzy's",
                date: '4/19/23',
                time: '7:00 PM',
            };
            setScheduledRide(mockRide); // or null to test "no rides"
        };

        loadUserData();
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom || 10 }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.greeting}>
                    {greeting()}, <Text style={styles.name}>{fullName}</Text>
                </Text>

                <TouchableOpacity style={styles.card}>
                    {scheduledRide ? (
                        <>
                            <View style={styles.rideRow}>
                                <Text style={styles.rideFrom}>{scheduledRide.from}</Text>
                                <Text style={styles.arrow}>→</Text>
                                <Text style={styles.rideTo}>{scheduledRide.to}</Text>
                            </View>
                            <Text style={styles.rideDate}>{scheduledRide.date} - {scheduledRide.time}</Text>
                        </>
                    ) : (
                        <Text style={styles.noRide}>No Scheduled Rides</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
    },
    scrollContent: {
        padding: 20,
    },
    greeting: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 16,
    },
    name: {
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 16,
        position: 'relative',
    },
    noRide: {
        color: '#fff',
        fontSize: 16,
    },
    rideRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    rideFrom: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    arrow: {
        color: '#f3631a',
        marginHorizontal: 6,
        fontWeight: 'bold',
        fontSize: 16,
    },
    rideTo: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    rideDate: {
        color: '#aaa',
        fontSize: 14,
    },
    addBtn: {
        position: 'absolute',
        right: 12,
        top: 12,
    },
    plus: {
        color: '#f3631a',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
