import type React from "react"
import { View, type ViewStyle, Dimensions, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface SafeContainerProps {
  children: React.ReactNode
  style?: ViewStyle
  includeTop?: boolean
  includeBottom?: boolean
  backgroundColor?: string
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

// Device detection
const isTablet = screenWidth >= 768
const isSmallDevice = screenWidth < 375 || screenHeight < 667
const hasNotch = Platform.OS === "ios" && screenHeight >= 812
const hasDynamicIsland = Platform.OS === "ios" && screenHeight >= 852

export default function SafeContainer({
  children,
  style,
  includeTop = true,
  includeBottom = true,
  backgroundColor = "#121212",
}: SafeContainerProps) {
  const insets = useSafeAreaInsets()

  // Calculate safe padding based on device type
  const getTopPadding = () => {
    if (!includeTop) return 0

    if (Platform.OS === "ios") {
      if (hasDynamicIsland) {
        return Math.max(insets.top, 59) // Dynamic Island height
      } else if (hasNotch) {
        return Math.max(insets.top, 44) // Notch height
      } else {
        return Math.max(insets.top, 20) // Status bar height
      }
    } else {
      // Android
      return Math.max(insets.top, 24)
    }
  }

  const getBottomPadding = () => {
    if (!includeBottom) return 0

    if (Platform.OS === "ios") {
      return Math.max(insets.bottom, 8)
    } else {
      return Math.max(insets.bottom, 16)
    }
  }

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: getTopPadding(),
    paddingBottom: getBottomPadding(),
    paddingLeft: Math.max(insets.left, isTablet ? 16 : 0),
    paddingRight: Math.max(insets.right, isTablet ? 16 : 0),
    ...style,
  }

  return <View style={containerStyle}>{children}</View>
}
