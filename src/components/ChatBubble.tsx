import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';
import { ChatMessage } from '../models/health';

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.sender === 'ai';
  const timeLabel = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isAI ? styles.rowAI : styles.rowUser]}>
      {isAI && (
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>A</Text>
        </View>
      )}
      <View style={[styles.bubble, isAI ? styles.bubbleAI : styles.bubbleUser]}>
        <Text style={[styles.messageText, isAI ? styles.textAI : styles.textUser]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isAI ? styles.timestampAI : styles.timestampUser]}>
          {timeLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: Spacing.m, alignItems: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },
  rowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.s,
  },
  avatarLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  bubble: { maxWidth: '75%', padding: Spacing.m, borderRadius: 16 },
  bubbleAI: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  textAI: { color: Colors.text },
  textUser: { color: '#FFF' },
  timestamp: { fontSize: 10, marginTop: 4 },
  timestampAI: { color: Colors.textSecondary },
  timestampUser: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
});
