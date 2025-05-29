import { StyleSheet, Dimensions } from "react-native"

const { width } = Dimensions.get("window")

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingBottom: 70, // Add padding to account for tab bar
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#2a2a2a",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#f3631a",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3631a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#f3631a",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#f3631a",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2a2a2a",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  bio: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
  },
  editBtn: {
    backgroundColor: "#f3631a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  settingsBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#f3631a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsText: {
    color: "#f3631a",
    fontWeight: "600",
    fontSize: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  infoItem: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  label: {
    fontWeight: "600",
    color: "#f3631a",
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    width: (width - 50) / 2,
    minHeight: 100,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
    marginTop: 4,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },

  // Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 15,
    padding: 20,
    width: width * 0.85,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#f3631a",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#666",
  },
  modalButtonDestructive: {
    backgroundColor: "#ff4444",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalButtonTextCancel: {
    color: "#fff",
  },
  modalButtonTextDestructive: {
    color: "#fff",
  },

  // Settings Modal Styles
  settingsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 1000,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  settingsCloseButton: {
    padding: 5,
  },
  settingsContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Add extra bottom padding for settings modal
  },
  settingSection: {
    marginBottom: 30,
  },
  settingSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f3631a",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  settingItem: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: "#ccc",
  },
  settingItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingItemValue: {
    fontSize: 14,
    color: "#f3631a",
    fontWeight: "500",
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 60, // Increase bottom margin to ensure logout button is visible
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Selection Modal Styles
  selectionModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  selectionOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#333",
    borderRadius: 10,
    marginBottom: 8,
  },
  selectionOptionText: {
    fontSize: 16,
    color: "#fff",
  },
})
