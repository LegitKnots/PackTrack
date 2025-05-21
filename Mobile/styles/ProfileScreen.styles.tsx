import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1e1e1e',
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 30,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 100,
      backgroundColor: '#444',
      marginBottom: 12,
    },
    username: {
      color: '#fff',
      fontSize: 24,
      fontWeight: '700',
    },
    bio: {
      color: '#aaa',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 12,
    },
    editBtn: {
      backgroundColor: '#f3631a',
      paddingVertical: 10,
      paddingHorizontal: 28,
      borderRadius: 6,
    },
    editText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    infoSection: {
      backgroundColor: '#2c2c2c',
      padding: 20,
      borderRadius: 10,
    },
    infoItem: {
      color: '#fff',
      fontSize: 16,
      marginBottom: 12,
    },
    label: {
      fontWeight: 'bold',
      color: '#aaa',
    },
    errorText: {
      color: '#f55',
      fontSize: 16,
      alignSelf: 'center',
    },
  });