import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      padding: 24,
      flex: 1,
      justifyContent: 'center',
      backgroundColor: '#1e1e1e',
    },
    header: {
      fontSize: 22,
      color: '#fff',
      marginBottom: 20,
      fontWeight: 'bold',
    },
    input: {
      backgroundColor: '#333',
      color: '#fff',
      padding: 10,
      marginBottom: 16,
      borderRadius: 8,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
    buttonPrimary: {
      backgroundColor: '#f3631a',
      padding: 12,
      borderRadius: 8,
    },
    buttonCancel: {
      backgroundColor: '#555',
      padding: 12,
      borderRadius: 8,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });
  