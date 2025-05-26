import { StyleSheet, Dimensions } from "react-native"

const { width } = Dimensions.get("window")

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f3631a",
    marginBottom: 30,
    textAlign: "center",
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePicturePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  profilePictureText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 5,
  },
  changePhotoButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  changePhotoText: {
    color: "#f3631a",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    width: width * 0.85,
    height: 50,
    backgroundColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#fff",
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#555",
  },
  button: {
    width: width * 0.85,
    height: 50,
    backgroundColor: "#f3631a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
})
