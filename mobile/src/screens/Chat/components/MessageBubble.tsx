import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  content: string;
  senderName?: string;
  timestamp: string;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  senderName,
  timestamp,
  isOwn,
}) => {
  return (
    <View
      style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
      ]}
    >
      {!isOwn && senderName && (
        <Text style={styles.sender}>{senderName}</Text>
      )}
      <Text style={styles.content}>{content}</Text>
      <Text style={[styles.time, isOwn && styles.ownTime]}>
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MessageBubble;
