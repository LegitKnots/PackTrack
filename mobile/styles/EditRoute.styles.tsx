import { StyleSheet } from "react-native"
import { PRIMARY_APP_COLOR } from "../config"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    flex: 1,
    padding: 20,
  },

  // Labels and text
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 24,
  },

  // Input styling - matching your theme
  input: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  // Toggle container - matching your existing style
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  toggleLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleOptions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 4,
  },
  toggleText: {
    color: "#aaa",
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  activeToggleText: {
    color: PRIMARY_APP_COLOR,
    fontWeight: "600",
  },

  // Location cards - simplified, no colored bars
  locationCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },

  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  locationTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationTitleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  removeButton: {
    backgroundColor: "#333",
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: "#ff4444",
  },

  // Coordinate inputs
  coordinateContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  coordinateField: {
    flex: 1,
  },
  coordinateLabel: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  coordinateInput: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 12,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
    textAlign: "center",
  },

  // Add waypoint button - simplified
  addWaypointButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  addWaypointContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addWaypointText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Visibility options - matching your existing style
  visibilityContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  visibilityOption: {
    flex: 1,
    padding: 16,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#333",
  },
  selectedVisibility: {
    backgroundColor: PRIMARY_APP_COLOR + "20",
    borderColor: PRIMARY_APP_COLOR,
  },
  visibilityText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Save button - matching your existing style
  saveButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Modal styling - matching your existing modals
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
    paddingTop: 60,
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  suggestionItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_APP_COLOR,
  },
  suggestionText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingText: {
    color: "#aaa",
    textAlign: "center",
    fontSize: 16,
    marginTop: 32,
  },
  modalCancelButton: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#555",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Waypoint name input
  waypointNameInput: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 12,
    borderRadius: 6,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 8,
  },
})
