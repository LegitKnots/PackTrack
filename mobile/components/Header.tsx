"use client"
import { View, Text, TouchableOpacity, StatusBar } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

interface HeaderProps {
  title: string
  onBackPress?: () => void
  showBackButton?: boolean
  rightIcon?: "menu" | "info" | "settings" | "share" | "users" | "refresh" | null
  onRightPress?: () => void
  backgroundColor?: string
}

export default function Header({
  title,
  onBackPress,
  showBackButton = true,
  rightIcon = null,
  onRightPress,
  backgroundColor = "#1a1a1a",
}: HeaderProps) {
  const insets = useSafeAreaInsets()

  const getRightIconName = () => {
    switch (rightIcon) {
      case "menu":
        return "more-vert"
      case "info":
        return "info"
      case "settings":
        return "settings"
      case "share":
        return "share"
      case "users":
        return "group"
      case "refresh":
        return "refresh"
      default:
        return "more-vert"
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />

      {/* Status bar fill */}
      <View style={{ height: insets.top, backgroundColor }} />

      {/* Header */}
      <View
        style={{
          backgroundColor,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 16,
          minHeight: 56,
        }}
      >
        {/* Left side - Back button or spacer */}
        <View style={{ width: 40, alignItems: "flex-start" }}>
          {showBackButton && onBackPress ? (
            <TouchableOpacity onPress={onBackPress} style={{ padding: 8, margin: -8 }}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center - Title */}
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "600",
            textAlign: "center",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right side - Action button or spacer */}
        <View style={{ width: 40, alignItems: "flex-end" }}>
          {rightIcon && onRightPress ? (
            <TouchableOpacity onPress={onRightPress} style={{ padding: 8, margin: -8 }}>
              <MaterialIcons name={getRightIconName() as any} size={24} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </>
  )
}
