import {StyleSheet} from 'react-native';

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
    paddingHorizontal: 16,
  },
  routeCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    width: '100%',
  },
  routeName: {
    fontWeight: "bold",
    fontSize: 18,
    color: '#fff',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  routeText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
    overflow: 'hidden',
    maxWidth: '100%',
  },

  distance: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'right',
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
    elevation: 0,
  },
  plusIcon: {
    fontSize: 28,
    color: '#f3631a',
    fontWeight: 'bold',
    lineHeight: 28,
  },
});
