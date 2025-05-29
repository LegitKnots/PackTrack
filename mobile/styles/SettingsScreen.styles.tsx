import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  resetButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#fff",
  },
  settingSection: {
    marginTop: 24,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f3631a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    marginBottom: 1,
    borderRadius: 8,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingItemContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  settingItemTitleDisabled: {
    color: "#666",
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: "#999",
  },
  settingItemSubtitleDisabled: {
    color: "#555",
  },
  settingItemRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  settingItemValue: {
    fontSize: 14,
    color: "#f3631a",
    fontWeight: "500",
  },
  settingItemValueDisabled: {
    color: "#666",
  },
  logoutSection: {
    marginTop: 40,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectionModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  selectionOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectionOptionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  selectionOptionDescription: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f3631a",
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#666",
  },
  modalButtonDestructive: {
    backgroundColor: "#dc3545",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalButtonTextCancel: {
    color: "#fff",
  },
  modalButtonTextDestructive: {
    color: "#fff",
  },
})
