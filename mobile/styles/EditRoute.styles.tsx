import { StyleSheet } from "react-native";
import { PRIMARY_APP_COLOR } from "../config";

export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#121212",
    },
    header: {
      height: 60,
      backgroundColor: "#1e1e1e",
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    content: {
      flex: 1,
      padding: 16,
    },
    label: {
      color: "#fff",
      fontSize: 16,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: "#333",
      color: "#fff",
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
    },
    visibilityContainer: {
      flexDirection: "row",
      marginTop: 8,
    },
    visibilityOption: {
      flex: 1,
      padding: 12,
      backgroundColor: "#333",
      alignItems: "center",
      marginRight: 8,
      borderRadius: 8,
    },
    selectedVisibility: {
      backgroundColor: PRIMARY_APP_COLOR,
    },
    visibilityText: {
      color: "#fff",
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: PRIMARY_APP_COLOR,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 24,
      marginBottom: 40,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "#1e1e1e",
      padding: 16,
    },
    suggestionItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#333",
    },
    suggestionText: {
      color: "#ccc",
      fontSize: 16,
    },
    loadingText: {
      color: "#777",
      textAlign: "center",
      fontSize: 16,
      marginTop: 24,
    },
    cancelButton: {
      backgroundColor: "#333",
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 24,
    },
    cancelText: {
      color: "#f3631a",
      fontSize: 16,
    },
    toggleContainer: {
      marginTop: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleLabel: {
      color: "#fff",
      fontSize: 16,
    },
    toggleOptions: {
      flexDirection: "row",
      alignItems: "center",
    },
    toggleText: {
      color: "#aaa",
      marginHorizontal: 8,
    },
    activeToggleText: {
      color: PRIMARY_APP_COLOR,
    },
    coordinateContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    coordinateField: {
      flex: 1,
      marginRight: 8,
    },
    coordinateLabel: {
      color: "#aaa",
      fontSize: 14,
      marginBottom: 4,
    },
    coordinateInput: {
      backgroundColor: "#333",
      color: "#fff",
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
    },
  })
  