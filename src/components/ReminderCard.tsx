import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';

interface Reminder {
  id: string;
  text: string;
  subtitle: string;
}

const INITIAL_REMINDERS: Reminder[] = [
  { id: '1', text: 'Device Check Appointment', subtitle: 'Next Tuesday at 2:00 PM' },
  { id: '2', text: 'Merlin.net Nightly Sync', subtitle: 'Daily at 9:00 PM' },
  { id: '3', text: 'Low Sodium Diet Goal', subtitle: 'Daily reminder' },
];

export function ReminderCard() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Reminders</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { /* demo: no-op */ }}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {INITIAL_REMINDERS.map((reminder, index) => (
        <TouchableOpacity
          key={reminder.id}
          style={[styles.row, index < INITIAL_REMINDERS.length - 1 && styles.rowBorder]}
          onPress={() => toggle(reminder.id)}
        >
          <View style={[styles.checkbox, completed.has(reminder.id) && styles.checkboxDone]}>
            {completed.has(reminder.id) && <Text style={styles.checkmark}>&#10003;</Text>}
          </View>
          <View style={styles.reminderContent}>
            <Text style={[styles.reminderTitle, completed.has(reminder.id) && styles.reminderTitleDone]}>
              {reminder.text}
            </Text>
            <Text style={styles.reminderSubtitle}>{reminder.subtitle}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.l,
    marginTop: Spacing.l,
    marginBottom: Spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.m,
  },
  cardTitle: { ...Typography.h2, color: Colors.text },
  addButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.m, paddingVertical: Spacing.s,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.legalGray,
  },
  addButtonText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.m },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.primary,
    marginRight: Spacing.m,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  reminderContent: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reminderTitleDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  reminderSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
