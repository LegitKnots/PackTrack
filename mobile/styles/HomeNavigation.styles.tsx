import { StyleSheet, Dimensions } from "react-native"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
const isTablet = screenWidth >= 768
const isSmallDevice = screenWidth < 375

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  tabBarContainer: {
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: isTablet ? 40 : 16,
    paddingTop: isTablet ? 12 : 8,
    minHeight: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 8 : 6,
    minHeight: 44, // Accessibility minimum
    maxWidth: isTablet ? 120 : 80,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: isTablet ? 14 : isSmallDevice ? 11 : 12,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#f3631a",
  },
  inactiveTabLabel: {
    color: "#666",
  },
})
