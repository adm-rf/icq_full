import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Message {
  id: number;
  content: string;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    avatarUrl?: string | null;
  };
}

interface ChatRoomScreenProps {
  route: { params: { conversationId: number; title?: string } };
  navigation: { goBack: () => void };
}

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  route,
  navigation,
}) => {
  const { conversationId, title } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    
    // TODO: Set up WebSocket listeners for real-time messages
    // websocket.on('message:new', handleNewMessage);
    
    return () => {
      // TODO: Clean up WebSocket listeners
    };
  }, [conversationId]);

  const loadMessages = async () => {
    // TODO: Fetch messages from API
    console.log(`Loading messages for conversation ${conversationId}`);
    setMessages([]);
    setLoading(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender?.id === 1; // TODO: Get current user ID from auth store

    return (
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.sender?.username || 'Unknown'}</Text>
        )}
        <Text style={styles.messageContent}>{item.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title || `Chat #${conversationId}`}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start the conversation!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {/* TODO: Add MessageInput component */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputPlaceholder}>Message input will be added here</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 15,
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ChatRoomScreen;
