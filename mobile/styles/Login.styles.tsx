import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1e1e1e',
    },
    title: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#f3631a',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: '#fff',
      marginBottom: 20,
      textAlign: 'center',
    },
    formView: {
      marginTop: 80,
      alignItems: 'center',
    },
    input: {
      color: '#fff',
      backgroundColor: '#2c2c2c',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 12,
      width: width * 0.75,
      fontSize: 16,
      marginBottom: 15,
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
    switchText: {
      marginTop: 20,
      color: '#aaa',
    },
  });
  