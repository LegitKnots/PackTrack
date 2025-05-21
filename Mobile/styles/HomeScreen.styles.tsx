import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
