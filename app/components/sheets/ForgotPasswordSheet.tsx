import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Modal, ActivityIndicator,
  Platform, KeyboardAvoidingView, Animated, Dimensions
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { supabase } from '../../lib/supabase';

interface ForgotPasswordSheetProps {
  visible: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordSheet: React.FC<ForgotPasswordSheetProps> = ({ visible, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const canSend = EMAIL_RE.test(email.trim());

  // Reset state when closed
  useEffect(() => {
    if (!visible) {
      setTimeout(() => { setEmail(''); setSent(false); setLoading(false); }, 400);
    }
  }, [visible]);

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: 'talentlogic://reset-password',
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.sheet, sheetShadow]}>
            {/* Handle bar */}
            <View style={styles.handle} />

            {sent ? (
              // Success state
              <View style={styles.successBlock}>
                <View style={styles.successIcon}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Email sent!</Text>
                <Text style={styles.successSub}>Check your inbox for the reset link.</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Form state
              <>
                <Text style={styles.sheetTitle}>Reset password</Text>
                <Text style={styles.sheetSub}>
                  Enter your email and we'll send you a reset link.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email address</Text>
                  <View style={[
                    styles.inputWrap,
                    focused && styles.inputWrapFocused,
                  ]}>
                    <TextInput
                      style={styles.input as any}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#B0B8D0"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      selectionColor="#4C59D7"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={!canSend || loading}
                  activeOpacity={canSend ? 0.85 : 1}
                >
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" size="small" />
                    : <Text style={[styles.sendBtnText, !canSend && { opacity: 0.7 }]}>Send Reset Link</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const sheetShadow = Platform.select({
  web: { boxShadow: '0px -8px 40px rgba(26,26,46,0.12)' } as any,
  default: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 40, elevation: 20 },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26,26,46,0.4)',
  },
  sheet: {
    width: SCREEN_WIDTH,
    maxWidth: SCREEN_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 50,            // 34pt home indicator + 16pt
    paddingTop: 8,
    minHeight: 320,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D0D7FF',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#3B43A7', marginBottom: 8,
  },
  sheetSub: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', lineHeight: 22, marginBottom: 20,
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium',
    color: '#1A1A2E', marginBottom: 8,
  },
  inputWrap: {
    height: 52, borderRadius: 12,
    borderWidth: 1, borderColor: '#D0D7FF',
    backgroundColor: '#F4F6FF',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderWidth: 1.5, borderColor: '#4C59D7',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1, fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#1A1A2E',
    outlineWidth: 0, padding: 0,
  },
  sendBtn: {
    height: 52, borderRadius: 14,
    backgroundColor: '#4C59D7',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7CCF5' },
  sendBtnText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF',
  },
  // Success
  successBlock: { alignItems: 'center', paddingVertical: 16 },
  successIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  successCheck: { fontSize: 22, color: '#FFFFFF', fontFamily: 'PlusJakartaSans_700Bold' },
  successTitle: {
    fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold',
    color: '#3B43A7', marginBottom: 8,
  },
  successSub: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  closeBtn: {
    height: 48, paddingHorizontal: 32,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E8EAFF',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#4C59D7',
  },
});
