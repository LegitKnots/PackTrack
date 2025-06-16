"use client";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

interface HeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  leftIcon?: "leftArrow" | "close";
  rightIcon?: "menu" | "info" | "settings" | "share" | "users" | "refresh" | null;
  onRightPress?: () => void;
  backgroundColor?: string;
  opacity?: number;
  overlay?: boolean;
}

export default function Header({
  title,
  onBackPress,
  showBackButton = true,
  leftIcon = "leftArrow",
  rightIcon = null,
  onRightPress,
  backgroundColor = "#1a1a1a",
  opacity = 100,
  overlay = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const clampedOpacity = Math.min(1, Math.max(0, opacity / 100));

  const getLeftIconName = () => {
    switch (leftIcon) {
      case "leftArrow":
        return "arrow-back";
      case "close":
        return "close";
      default:
        return "arrow-back";
    }
  };

  const getRightIconName = () => {
    switch (rightIcon) {
      case "menu":
        return "more-vert";
      case "info":
        return "info";
      case "settings":
        return "settings";
      case "share":
        return "share";
      case "users":
        return "group";
      case "refresh":
        return "refresh";
      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />

      {/* Top padding for status bar area */}
      <View style={{ height: insets.top, backgroundColor }} />

      {/* Header container */}
      <View style={[styles.headerContainer, { backgroundColor, opacity: clampedOpacity, position: opacity? "absolute" : "relative", top: insets.top}]}>
        {/* Left Icon */}
        <View style={styles.sideIconContainer}>
          {showBackButton && onBackPress && (
            <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
              <MaterialIcons name={getLeftIconName()} size={24} color="#fff" />
            </TouchableOpacity>
          )}
          
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Icon */}
        <View style={styles.sideIconContainer}>
          {rightIcon && onRightPress && getRightIconName() && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              <MaterialIcons name={getRightIconName() as string} size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    minHeight: 56,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sideIconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
