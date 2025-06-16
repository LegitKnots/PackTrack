"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, Modal, TouchableOpacity, Animated, Dimensions, StyleSheet } from "react-native"
import { PanGestureHandler, State } from "react-native-gesture-handler"

const { height } = Dimensions.get("window")

interface SlideUpModalProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  maxHeight?: number // Optional prop to customize max height
}

export const SlideUpModal: React.FC<SlideUpModalProps> = ({ visible, onClose, children, maxHeight = height * 0.8 }) => {
  const translateY = useRef(new Animated.Value(height)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const onGestureEvent = (event: any) => {
    const { translationY } = event.nativeEvent

    // Apply resistance when trying to drag up (negative translationY)
    if (translationY < 0) {
      // Create a rubber band effect with high tension
      const resistance = Math.abs(translationY) * 0.2 // Reduce movement by 80%
      translateY.setValue(-resistance)
    } else {
      // Normal movement when dragging down
      translateY.setValue(translationY)
    }
  }

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent

      if (translationY > 100 || velocityY > 500) {
        // Close modal when dragged down sufficiently
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onClose())
      } else {
        // Snap back to original position with smooth animation
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }
    }
  }

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.modalOverlay, { opacity }]}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
          <Animated.View style={[styles.slideUpModal, { transform: [{ translateY }], maxHeight }]}>
            <View style={styles.modalHandle} />
            {children}
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  slideUpModal: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34, // Safe area padding
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#666",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
})

export const slideUpModalStyles = StyleSheet.create({
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 12,
  },
  modalOptionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  modalCancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  modalCancelText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "500",
  },
})
