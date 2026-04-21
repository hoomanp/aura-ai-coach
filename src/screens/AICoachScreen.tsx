import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';
import { StubDataService } from '../services/StubDataService';
import { HealthAIEngine } from '../ai/HealthAIEngine';
import { ChatBubble } from '../components/ChatBubble';
import { ReminderCard } from '../components/ReminderCard';
import { ChatMessage } from '../models/health';

const QUICK_REPLIES = [
  'How is my pacing?',
  'Is my fluid normal?',
  'Can I exercise today?',
];

let msgCounter = 200;

export function AICoachScreen() {
  const isDemo = StubDataService.isDemoMode();
  const currentTelemetry = StubDataService.getCurrentTelemetry();
  const demoState = isDemo ? StubDataService.getDemoState() : null;

  const [messages, setMessages] = useState<ChatMessage[]>(
    demoState ? demoState.preloadedChatMessages : [],
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: String(++msgCounter),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: String(++msgCounter),
        sender: 'ai',
        text: HealthAIEngine.getChatResponse(trimmed, currentTelemetry),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 1200);
  }, [currentTelemetry]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={Typography.h1}>Aura AI Coach</Text>
          <Text style={[Typography.caption, { marginTop: 4 }]}>
            Powered by Abbott\u00AE Merlin.net\u2122
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <View style={styles.typingRow}>
              <View style={styles.typingAvatar}>
                <Text style={styles.typingAvatarLabel}>A</Text>
              </View>
              <View style={styles.typingBubble}>
                <Text style={styles.typingText}>Aura AI is thinking...</Text>
              </View>
            </View>
          )}

          <ReminderCard />
        </ScrollView>

        <View style={styles.quickRepliesRow}>
          {QUICK_REPLIES.map(reply => (
            <TouchableOpacity key={reply} style={styles.chip} onPress={() => sendMessage(reply)}>
              <Text style={styles.chipText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Aura AI about your heart..."
            placeholderTextColor={Colors.textSecondary}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.m, paddingTop: Spacing.m, paddingBottom: Spacing.s },
  chatContent: { padding: Spacing.m, paddingBottom: Spacing.l },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.m },
  typingAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.s,
  },
  typingAvatarLabel: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  typingBubble: {
    backgroundColor: Colors.card, padding: Spacing.m, borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 13 },
  quickRepliesRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.m, paddingBottom: Spacing.s,
    gap: 8,
  },
  chip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: Spacing.m, paddingVertical: Spacing.s,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.primary,
  },
  chipText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m, paddingBottom: Spacing.m,
    alignItems: 'center', gap: Spacing.s,
  },
  input: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 22,
    paddingHorizontal: Spacing.m, paddingVertical: 12,
    fontSize: 14, color: Colors.text,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.m, paddingVertical: 12,
    borderRadius: 22,
  },
  sendButtonDisabled: { backgroundColor: Colors.textSecondary },
  sendButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
