import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography } from '../theme/Theme';
import { HealthPlatformService, HealthPlatformInfo } from '../services/HealthPlatformService';
import { UserAccount } from '../models/health';

interface HealthAccountModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: (account: UserAccount) => void;
}

export const HealthAccountModal: React.FC<HealthAccountModalProps> = ({ isVisible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const platformInfo: HealthPlatformInfo = HealthPlatformService.getPlatformInfo();

  const handleAppleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const account = await HealthPlatformService.loginWithApple();
      const permResult = await HealthPlatformService.requestPermissions();
      if (!permResult.success && permResult.error) {
        setErrorMessage(permResult.error);
      } else {
        onSuccess(account);
        onClose();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Apple Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const account = await HealthPlatformService.loginWithGoogle();
      const permResult = await HealthPlatformService.requestPermissions();
      if (!permResult.success && permResult.error) {
        setErrorMessage(permResult.error);
      } else {
        onSuccess(account);
        onClose();
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isIOS = Platform.OS === 'ios';

  return (
    <Modal transparent={true} animationType="slide" visible={isVisible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={isIOS ? 'logo-apple' : 'logo-google'}
                size={28}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.title}>Connect Your Health Account</Text>
            <Text style={styles.subtitle}>
              {isIOS
                ? 'Sign in with your Apple ID to enable encrypted sync with Apple Health.'
                : 'Sign in with your Google Account to connect Google Health Connect.'}
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Connecting to {platformInfo.serviceName}...</Text>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              {/* Primary platform button */}
              {isIOS ? (
                <TouchableOpacity style={styles.appleButton} onPress={handleAppleLogin}>
                  <Ionicons name="logo-apple" size={20} color="#FFF" style={styles.buttonIcon} />
                  <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.buttonIcon} />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
              )}

              {/* Cross-platform alternative option */}
              {isIOS ? (
                <TouchableOpacity style={styles.altButton} onPress={handleGoogleLogin}>
                  <Ionicons name="logo-google" size={18} color={Colors.text} style={styles.buttonIcon} />
                  <Text style={styles.altButtonText}>Or use Google Account</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.altButton} onPress={handleAppleLogin}>
                  <Ionicons name="logo-apple" size={18} color={Colors.text} style={styles.buttonIcon} />
                  <Text style={styles.altButtonText}>Or use Apple ID</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.textSecondary} />
            <Text style={styles.privacyText}>
              Your health data is protected under HIPAA/GDPR best practices and encrypted on your device.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.m,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: Spacing.l,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: Spacing.s,
    marginBottom: Spacing.m,
    width: '100%',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingBox: {
    paddingVertical: Spacing.l,
    alignItems: 'center',
    gap: Spacing.s,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  buttonsContainer: {
    width: '100%',
    gap: Spacing.s,
    marginVertical: Spacing.s,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  appleButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  googleButtonText: {
    color: '#3C4043',
    fontSize: 15,
    fontWeight: '600',
  },
  altButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  altButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.m,
    paddingHorizontal: Spacing.s,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
});
