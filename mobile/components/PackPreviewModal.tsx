"use client"
import React from "react"
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native"
import { X, Users, MapPin, Calendar, MessageCircle, Lock, Globe } from "lucide-react-native"
import { PRIMARY_APP_COLOR } from "../config"
import type { PackDetails } from "../types/Pack"

interface PackPreviewModalProps {
  visible: boolean
  onClose: () => void
  pack: PackDetails | null
  onJoin: () => Promise<void>
  isJoining: boolean
  isMember: boolean
}

const { width, height } = Dimensions.get("window")

export default function PackPreviewModal({
  visible,
  onClose,
  pack,
  onJoin,
  isJoining,
  isMember,
}: PackPreviewModalProps) {
  if (!pack) return null

  const getPackAge = (createdAt?: any) => {
    try {
      if (!createdAt) return "New pack"

      // Handle Firebase Timestamp object
      let created: Date
      if (createdAt && typeof createdAt === "object" && "seconds" in createdAt) {
        // Firebase Timestamp format
        created = new Date(createdAt.seconds * 1000)
      } else if (
        createdAt &&
        typeof createdAt === "object" &&
        "toDate" in createdAt &&
        typeof createdAt.toDate === "function"
      ) {
        // Firebase Timestamp with toDate method
        created = createdAt.toDate()
      } else if (createdAt && createdAt._seconds) {
        // Firebase Timestamp serialized format
        created = new Date(createdAt._seconds * 1000)
      } else {
        // Regular date string or timestamp
        created = new Date(createdAt)
      }

      // Check if date is valid
      if (isNaN(created.getTime())) return "New pack"
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? "" : "s"} old`
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `${weeks} week${weeks === 1 ? "" : "s"} old`
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30)
        return `${months} month${months === 1 ? "" : "s"} old`
      } else {
        const years = Math.floor(diffDays / 365)
        return `${years} year${years === 1 ? "" : "s"} old`
      }
    } catch (error) {
      console.log("Error calculating pack age:", error, "createdAt value:", createdAt)
      return "New pack"
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header with background image */}
        <View style={styles.header}>
          {pack.imageUrl ? (
            <Image source={{ uri: pack.imageUrl }} style={styles.backgroundImage} />
          ) : (
            <View style={styles.backgroundPlaceholder} />
          )}
          <View style={styles.headerOverlay} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="white" size={24} />
          </TouchableOpacity>

          {/* Pack image and basic info */}
          <View style={styles.headerContent}>
            {pack.imageUrl ? (
              <Image source={{ uri: pack.imageUrl }} style={styles.packImage} />
            ) : (
              <View style={[styles.packImage, styles.packImagePlaceholder]}>
                <Text style={styles.packImagePlaceholderText}>
                  {pack.name && pack.name.length > 0 ? pack.name.charAt(0).toUpperCase() : "P"}
                </Text>
              </View>
            )}

            <Text style={styles.packName}>{pack.name}</Text>

            <View style={styles.visibilityBadge}>
              {pack.visibility === "public" ? (
                <>
                  <Globe color="white" size={12} />
                  <Text style={styles.visibilityText}>Public</Text>
                </>
              ) : (
                <>
                  <Lock color="white" size={12} />
                  <Text style={styles.visibilityText}>Private</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Description */}
          {pack.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{pack.description}</Text>
            </View>
          )}

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Users color={PRIMARY_APP_COLOR} size={20} />
              </View>
              <Text style={styles.statValue}>{Array.isArray(pack.members) ? pack.members.length : 0}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <MapPin color={PRIMARY_APP_COLOR} size={20} />
              </View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Routes</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Calendar color={PRIMARY_APP_COLOR} size={20} />
              </View>
              <Text style={styles.statValue}>{getPackAge(pack.createdAt)}</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>

            {pack.options?.hasChat && (
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <MessageCircle color={PRIMARY_APP_COLOR} size={20} />
                </View>
                <Text style={styles.statValue}>✓</Text>
                <Text style={styles.statLabel}>Chat</Text>
              </View>
            )}
          </View>

          {/* Owner Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pack Owner</Text>
            <View style={styles.ownerInfo}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarText}>{pack.owner ? pack.owner.charAt(0).toUpperCase() : "?"}</Text>
              </View>
              <View>
                <Text style={styles.ownerName}>Pack Owner</Text>
                <Text style={styles.ownerUsername}>@{pack.owner || "unknown"}</Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          {pack.tags && Array.isArray(pack.tags) && pack.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {pack.tags.map((tag, index) => (
                  <View key={index} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: pack.options?.hasChat ? "#4CAF50" : "#666" }]}>
                  <MessageCircle color="white" size={16} />
                </View>
                <Text style={styles.featureText}>{pack.options?.hasChat ? "Chat enabled" : "No chat"}</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: "#4CAF50" }]}>
                  <MapPin color="white" size={16} />
                </View>
                <Text style={styles.featureText}>Route sharing</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: "#4CAF50" }]}>
                  <Users color="white" size={16} />
                </View>
                <Text style={styles.featureText}>Group rides</Text>
              </View>
            </View>
          </View>

          {/* Bottom spacing for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {isMember ? (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>✓ Already a member</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
              onPress={onJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.joinButtonText}>Join Pack</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    height: height * 0.35,
    position: "relative",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  backgroundPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2a2a",
    position: "absolute",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  headerContent: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  packImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 4,
    borderColor: "white",
  },
  packImagePlaceholder: {
    backgroundColor: PRIMARY_APP_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  packImagePlaceholderText: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
  packName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  visibilityText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(243, 99, 26, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY_APP_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ownerAvatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  ownerName: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  ownerUsername: {
    color: "#aaa",
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagBadge: {
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#ddd",
    fontSize: 12,
  },
  featuresList: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureText: {
    color: "#ccc",
    fontSize: 14,
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#121212",
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  joinButton: {
    backgroundColor: PRIMARY_APP_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: PRIMARY_APP_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberBadge: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  memberBadgeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
})
