import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1e1e1e',
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    tab: {
      alignItems: 'center',
    },
    tabText: {
      fontSize: 16,
      color: '#aaa',
      fontWeight: '600',
    },
    activeTabText: {
      color: '#f3631a',
    },
    underline: {
      marginTop: 4,
      height: 2,
      width: 60,
      backgroundColor: '#f3631a',
      borderRadius: 2,
    },
    content: {
      flex: 1,
    },
    PackCard: {
      borderWidth: 1,
      borderColor: '#888',
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    PackText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    distance: {
      color: '#aaa',
      fontSize: 14,
    },
    placeholder: {
      color: '#888',
      textAlign: 'center',
      marginTop: 40,
    },
    plusBtnRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginVertical: 20,
      paddingRight: 20,
    },
  
    plusBtn: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      width: 42,
      height: 42,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 0, // remove shadow
    },
    plusIcon: {
      fontSize: 28,
      color: '#f3631a',
      fontWeight: 'bold',
      lineHeight: 28,
    },
  });
  