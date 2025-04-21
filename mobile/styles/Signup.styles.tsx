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
    fontSize: 42,
    fontWeight: 'bold',
    color: '#f3631a',
    marginBottom: 20,
  },
  formView: {
    alignItems: 'center',
    width: '100%',
  },
  input: {
    color: '#fff',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    width: width * 0.85,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#f3631a',
    paddingVertical: 15,
    width: width * 0.7,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    marginTop: 25,
    color: '#aaa',
    fontSize: 14,
  },
});