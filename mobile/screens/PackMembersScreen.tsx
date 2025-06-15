"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native"
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MoreHorizontal, X, Crown } from "lucide-react-native"
import { SERVER_URI, PRIMARY_APP_COLOR } from "../config"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../types/navigation"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type PackMembersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "PackMembers">
type PackMembersScreenRouteProp = RouteProp<RootStackParamList, "PackMembers">

interface Member {
  id: string
  fullname: string
  username: string
  profileImage?: string
  isOwner: boolean
}

export default function PackMembersScreen() {
  const navigation = useNavigation<PackMembersScreenNavigationProp>()
  const route = useRoute<PackMembersScreenRouteProp>()
  const { packId } = route.params
  const insets = useSafeAreaInsets()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)

  useFocusEffect(
    useCallback(() => {
      fetchMembers()
    }, []),
  )

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("token")
      const currentUserId = await AsyncStorage.getItem("userId")

      setUserId(currentUserId)

      if (!token) {
        Alert.alert("Authentication Error", "Missing token")
        return
      }

      const res = await fetch(`${SERVER_URI}/api/packs/${packId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch members")
      }

      // Find the owner
      const packRes = await fetch(`${SERVER_URI}/api/packs/${packId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const packData = await packRes.json()

      if (!packRes.ok) {
        throw new Error(packData.message || "Failed to fetch pack details")
      }

      const ownerId = packData.owner

      // Mark the owner and check if current user is owner
      const membersWithOwner = data.map((member: any) => ({
        ...member,
        isOwner: member.id === ownerId,
      }))

      setMembers(membersWithOwner)
      setIsOwner(currentUserId === ownerId)
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to fetch members")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${selectedMember.fullname || selectedMember.username} from the pack?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token")

              if (!token) {
                Alert.alert("Authentication Error", "Missing token")
                return
              }

              const res = await fetch(`${SERVER_URI}/api/packs/${packId}/members/${selectedMember.id}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              })

              if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to remove member")
              }

              setMembers(members.filter((member) => member.id !== selectedMember.id))
              setMenuVisible(false)
              setSelectedMember(null)
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to remove member")
            }
          },
        },
      ],
    )
  }

  const handlePromoteToOwner = async () => {
    if (!selectedMember) return

    Alert.alert(
      "Transfer Ownership",
      `Are you sure you want to make ${selectedMember.fullname || selectedMember.username} the owner of this pack? You will no longer be the owner.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token")

              if (!token) {
                Alert.alert("Authentication Error", "Missing token")
                return
              }

              const res = await fetch(`${SERVER_URI}/api/packs/${packId}/transfer-ownership`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ newOwnerId: selectedMember.id }),
              })

              if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to transfer ownership")
              }

              Alert.alert("Success", "Pack ownership transferred successfully")
              fetchMembers() // Refresh the members list
              setMenuVisible(false)
              setSelectedMember(null)
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to transfer ownership")
            }
          },
        },
      ],
    )
  }

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => {
        if (isOwner && item.id !== userId) {
          setSelectedMember(item)
          setMenuVisible(true)
        }
      }}
      disabled={!isOwner || item.id === userId}
    >
      <View style={styles.memberInfo}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.memberAvatar} />
        ) : (
          <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder]}>
            <Text style={styles.memberAvatarText}>{item.username?.charAt(0) || item.fullname?.charAt(0) || "U"}</Text>
          </View>
        )}
        <View>
          <Text style={styles.memberName}>{item.fullname || "Unknown"}</Text>
          <Text style={styles.memberUsername}>@{item.username || "user"}</Text>
        </View>
      </View>

      {item.isOwner && (
        <View style={styles.ownerBadge}>
          <Crown color="gold" size={16} />
          <Text style={styles.ownerBadgeText}>Owner</Text>
        </View>
      )}

      {isOwner && item.id !== userId && (
        <TouchableOpacity
          style={styles.memberActionButton}
          onPress={() => {
            setSelectedMember(item)
            setMenuVisible(true)
          }}
        >
          <MoreHorizontal color="white" size={20} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Status Bar Fill */}
      <View style={[styles.statusBarFill, { height: insets.top }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pack Members</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_APP_COLOR} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Member Action Menu */}
      <Modal visible={menuVisible} animationType="slide" transparent>
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <X color="white" size={24} />
            </TouchableOpacity>

            <Text style={styles.menuTitle}>{selectedMember?.fullname || selectedMember?.username || "Member"}</Text>

            {isOwner && selectedMember && !selectedMember.isOwner && (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handlePromoteToOwner}>
                  <Text style={styles.menuText}>Make Owner</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleRemoveMember}>
                  <Text style={[styles.menuText, { color: "#ff4444" }]}>Remove from Pack</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  statusBarFill: {
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#aaa",
    marginTop: 10,
    fontSize: 16,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  memberName: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  memberUsername: {
    color: "#aaa",
    fontSize: 14,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  ownerBadgeText: {
    color: "gold",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  memberActionButton: {
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#1e1e1e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 8,
  },
  menuTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  menuText: {
    color: "white",
    fontSize: 16,
  },
})
