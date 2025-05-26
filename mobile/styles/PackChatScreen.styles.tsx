import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    padding: 4,
  },
  infoButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  messagesContainer: {
    backgroundColor: "#121212",
  },
  inputToolbar: {
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputPrimary: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    borderWidth: 0,
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
  },
  sendContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  sendButton: {
    backgroundColor: "#f3631a",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#333",
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#121212",
  },
  typingBubble: {
    backgroundColor: "#2a2a2a",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  typingText: {
    color: "#666",
    fontSize: 14,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: "row",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  rightMessageWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginRight: 8,
    marginVertical: 2,
  },
  replyContainer: {
    backgroundColor: "#2a2a2a",
    borderTopWidth: 1,
    borderTopColor: "#3a3a3a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  replyContent: {
    flex: 1,
    marginRight: 12,
  },
  replyLabel: {
    color: "#f3631a",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    color: "#ccc",
    fontSize: 14,
  },
  cancelReplyButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#3a3a3a",
  },
  cancelReplyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
