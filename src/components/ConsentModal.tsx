import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../theme/Theme';

interface ConsentModalProps {
  isVisible: boolean;
  title: string;
  description: string;
  onAllow: () => void;
  onDeny: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isVisible, title, description, onAllow, onDeny }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onDeny}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.denyButton]} onPress={onDeny}>
              <Text style={styles.denyButtonText}>Deny</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.allowButton]} onPress={onAllow}>
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.l,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  denyButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.legalGray,
    marginRight: Spacing.s,
  },
  denyButtonText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  allowButton: {
    backgroundColor: Colors.primary,
    marginLeft: Spacing.s,
  },
  allowButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
