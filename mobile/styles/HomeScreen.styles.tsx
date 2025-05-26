import { StyleSheet, Dimensions } from "react-native"

const { width } = Dimensions.get("window")

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
  },
  name: {
    fontWeight: "bold",
    color: "#f3631a",
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
  },
  weatherSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20, // Changed back from 16
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  weatherMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16, // Added back
  },
  weatherIconLarge: {
    fontSize: 40, // Reduced from 48
    marginRight: 16, // Reduced from 20
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTempLarge: {
    fontSize: 32, // Reduced from 36
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2, // Reduced from 4
  },
  weatherConditionLarge: {
    fontSize: 16, // Reduced from 18
    color: "#fff",
    fontWeight: "600",
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  weatherDetailItem: {
    alignItems: "center",
  },
  weatherDetailIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  weatherDetailLabel: {
    fontSize: 10,
    color: "#aaa",
    marginBottom: 2,
  },
  weatherDetailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "600",
  },
  statSubtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  markAllReadButton: {
    backgroundColor: "#f3631a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllReadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  notificationCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#f3631a",
    backgroundColor: "#2d2d2d",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3631a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationText: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    color: "#666",
    fontSize: 12,
  },
  notificationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f3631a",
    marginLeft: 12,
    marginTop: 4,
  },
  viewAllButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  viewAllText: {
    color: "#f3631a",
    fontSize: 14,
    fontWeight: "600",
  },
  rideCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  rideInfo: {
    flex: 1,
  },
  rideDestination: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  ridePack: {
    color: "#aaa",
    fontSize: 14,
  },
  rideTime: {
    alignItems: "center",
    flexDirection: "row",
  },
  rideTimeText: {
    color: "#f3631a",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  rideArrow: {
    color: "#f3631a",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#444",
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyStateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    color: "#aaa",
    fontSize: 14,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f3631a",
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
  },
  activityAction: {
    fontWeight: "600",
  },
  activityPack: {
    color: "#f3631a",
    fontWeight: "600",
  },
  activityTime: {
    color: "#aaa",
    fontSize: 12,
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: "#f3631a",
  },
  modalButtonSecondary: {
    backgroundColor: "#444",
  },
  modalButtonDestructive: {
    backgroundColor: "#dc3545",
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
})
