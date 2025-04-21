import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
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
