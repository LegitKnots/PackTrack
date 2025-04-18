import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faHouse } from '@fortawesome/free-solid-svg-icons';





const { width } = Dimensions.get('window');

export default function Home() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom || 10 }]}>
            <View style={styles.content}>
                <Text style={styles.title}>Home Page</Text>
            </View>

            <View style={[styles.navBar, { paddingBottom: insets.bottom || 12 }]}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home' as never)}>
                <FontAwesomeIcon icon={faHouse} />                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile' as never)}>
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Settings' as never)}>
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        justifyContent: 'space-between',
    },

    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    title: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#f3631a',
        marginBottom: 10,
    },

    navBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2a2a2a',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingBottom: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 12, // Android shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navText: {
        color: '#fff',
        fontSize: 14,
    },


});
