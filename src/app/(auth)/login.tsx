import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '@/types/jastip';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'Masuk' | 'Daftar'>('Masuk');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Penitip');

  // Form states
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation & Error states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nama?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const clearFieldError = (field: 'nama' | 'email' | 'password' | 'confirmPassword') => {
    setFieldErrors((prev) => ({ ...prev, [field]: false }));
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    const newErrors: {
      nama?: boolean;
      email?: boolean;
      password?: boolean;
      confirmPassword?: boolean;
    } = {};
    let errorMsg = '';

    if (mode === 'Daftar' && !nama.trim()) {
      newErrors.nama = true;
    }
    if (!email.trim()) {
      newErrors.email = true;
    }
    if (!password.trim()) {
      newErrors.password = true;
    }
    if (mode === 'Daftar' && !confirmPassword.trim()) {
      newErrors.confirmPassword = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      if (newErrors.email && newErrors.password) {
        errorMsg = 'Harap isi kolom email dan kata sandi terlebih dahulu!';
      } else if (newErrors.email) {
        errorMsg = 'Harap isi kolom email terlebih dahulu!';
      } else if (newErrors.password) {
        errorMsg = 'Harap isi kolom kata sandi terlebih dahulu!';
      } else if (newErrors.nama) {
        errorMsg = 'Harap isi nama lengkap terlebih dahulu!';
      } else if (newErrors.confirmPassword) {
        errorMsg = 'Harap ulangi kata sandi Anda!';
      }
      setErrorMessage(errorMsg);

      if (Platform.OS === 'web') {
        window.alert(`Peringatan: ${errorMsg}`);
      } else {
        Alert.alert('Perhatian', errorMsg);
      }
      return;
    }

    if (mode === 'Daftar' && password !== confirmPassword) {
      setFieldErrors({ password: true, confirmPassword: true });
      const mismatchMsg = 'Kata sandi dan ulangi kata sandi tidak cocok!';
      setErrorMessage(mismatchMsg);
      if (Platform.OS === 'web') {
        window.alert(`Peringatan: ${mismatchMsg}`);
      } else {
        Alert.alert('Perhatian', mismatchMsg);
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      if (mode === 'Masuk') {
        await login(email.trim(), password);
        router.replace('/(main)' as any);
      } else {
        await register(nama.trim(), email.trim(), password, selectedRole);
        if (Platform.OS === 'web') {
          window.alert('Akun berhasil dibuat! Silakan masuk ke aplikasi.');
          router.replace('/(main)' as any);
        } else {
          Alert.alert('Berhasil', 'Akun berhasil dibuat!', [
            { text: 'Lanjut', onPress: () => router.replace('/(main)' as any) },
          ]);
        }
      }
    } catch (err: any) {
      const failMsg = err.message || 'Terjadi kesalahan saat autentikasi.';
      setErrorMessage(failMsg);
      if (failMsg.toLowerCase().includes('sandi') || failMsg.toLowerCase().includes('password')) {
        setFieldErrors({ password: true });
      } else if (failMsg.toLowerCase().includes('email')) {
        setFieldErrors({ email: true });
      }
      if (Platform.OS === 'web') {
        window.alert(`Gagal: ${failMsg}`);
      } else {
        Alert.alert('Gagal', failMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickDemoLogin = (roleType: UserRole) => {
    setErrorMessage(null);
    setFieldErrors({});
    if (roleType === 'Penitip') {
      setEmail('rani@email.com');
      setPassword('123456');
      setSelectedRole('Penitip');
    } else {
      setEmail('kevin@jastipgo.com');
      setPassword('123456');
      setSelectedRole('Jastiper');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={JasTipColors.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Teal Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLogoBox}>
            <Ionicons name="cube" size={32} color={JasTipColors.primary} />
          </View>
          <Text style={styles.brandTitle}>JasTipGo</Text>
          <Text style={styles.brandSubtitle}>Titip barang dari mana saja</Text>
        </View>

        {/* Main Card Form */}
        <View style={styles.cardContainer}>
          {/* Segmented Masuk / Daftar */}
          <View style={styles.segmentWrapper}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'Masuk' && styles.segmentBtnActive]}
              onPress={() => setMode('Masuk')}
            >
              <Text style={[styles.segmentText, mode === 'Masuk' && styles.segmentTextActive]}>
                Masuk
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'Daftar' && styles.segmentBtnActive]}
              onPress={() => setMode('Daftar')}
            >
              <Text style={[styles.segmentText, mode === 'Daftar' && styles.segmentTextActive]}>
                Daftar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          {mode === 'Daftar' && (
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.inputField, fieldErrors.nama && styles.inputFieldError]}
                placeholder="Nama lengkap"
                placeholderTextColor={JasTipColors.textMuted}
                value={nama}
                onChangeText={(val) => {
                  setNama(val);
                  if (fieldErrors.nama) clearFieldError('nama');
                }}
                autoCapitalize="words"
              />
              {fieldErrors.nama && (
                <Text style={styles.fieldErrorText}>* Kolom nama lengkap wajib diisi</Text>
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.inputField, fieldErrors.email && styles.inputFieldError]}
              placeholder="nama@email.com"
              placeholderTextColor={JasTipColors.textMuted}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (fieldErrors.email) clearFieldError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {fieldErrors.email && (
              <Text style={styles.fieldErrorText}>* Kolom email wajib diisi</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.inputField, styles.passwordInput, fieldErrors.password && styles.inputFieldError]}
                placeholder="Kata sandi"
                placeholderTextColor={JasTipColors.textMuted}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (fieldErrors.password) clearFieldError('password');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={JasTipColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.password && (
              <Text style={styles.fieldErrorText}>
                * {errorMessage && errorMessage.includes('sandi') ? errorMessage : 'Kolom kata sandi wajib diisi'}
              </Text>
            )}
          </View>

          {mode === 'Daftar' && (
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.inputField, fieldErrors.confirmPassword && styles.inputFieldError]}
                placeholder="Ulangi kata sandi"
                placeholderTextColor={JasTipColors.textMuted}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (fieldErrors.confirmPassword) clearFieldError('confirmPassword');
                }}
                secureTextEntry={!showPassword}
              />
              {fieldErrors.confirmPassword && (
                <Text style={styles.fieldErrorText}>* Kolom ulangi kata sandi wajib diisi</Text>
              )}
            </View>
          )}

          {/* Peran Selector */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: JasTipColors.textSecondary, marginBottom: 6 }}>
              {mode === 'Daftar' ? 'Pilih Peran Akun (Paten):' : 'Pilihan Akun:'}
            </Text>
            <View style={styles.roleWrapper}>
              <TouchableOpacity
                style={[styles.rolePill, selectedRole === 'Penitip' && styles.rolePillActive]}
                onPress={() => setSelectedRole('Penitip')}
              >
                <Ionicons
                  name="bag-handle-outline"
                  size={15}
                  color={selectedRole === 'Penitip' ? '#FFFFFF' : JasTipColors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.rolePillText, selectedRole === 'Penitip' && styles.rolePillTextActive]}
                >
                  Penitip
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rolePill, selectedRole === 'Jastiper' && styles.rolePillActive]}
                onPress={() => setSelectedRole('Jastiper')}
              >
                <Ionicons
                  name="airplane-outline"
                  size={15}
                  color={selectedRole === 'Jastiper' ? '#FFFFFF' : JasTipColors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.rolePillText, selectedRole === 'Jastiper' && styles.rolePillTextActive]}
                >
                  Jastiper
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#7A6014" style={{ marginRight: 6 }} />
            <Text style={styles.infoBannerText}>
              Peran akun bersifat paten sesuai pilihan pendaftaran akun.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{mode === 'Masuk' ? 'Masuk' : 'Buat akun'}</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Selector */}
          <View style={styles.demoHelper}>
            <Text style={styles.demoHelperTitle}>Coba Akun Demo Cepat:</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => quickDemoLogin('Penitip')}
              >
                <Text style={styles.demoChipText}>Penitip (Rani)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => quickDemoLogin('Jastiper')}
              >
                <Text style={styles.demoChipText}>Jastiper (Kevin)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JasTipColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandHeader: {
    backgroundColor: JasTipColors.primary,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  brandLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: JasTipColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#D4E6F0',
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EDF3F7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: JasTipColors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '600',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D7E4ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: JasTipColors.text,
    backgroundColor: '#FBFDFE',
  },
  inputFieldError: {
    borderColor: '#E53935',
    backgroundColor: '#FFF8F8',
  },
  fieldErrorText: {
    fontSize: 11,
    color: '#D32F2F',
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  roleWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7E4ED',
    backgroundColor: '#F8FBFC',
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: JasTipColors.primary,
    borderColor: JasTipColors.primary,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  rolePillTextActive: {
    color: '#FFFFFF',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF8E7',
    borderWidth: 1,
    borderColor: '#F5E2A8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#7A6014',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: JasTipColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoHelper: {
    borderTopWidth: 1,
    borderTopColor: '#EEF3F6',
    paddingTop: 14,
    alignItems: 'center',
  },
  demoHelperTitle: {
    fontSize: 12,
    color: JasTipColors.textMuted,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#EDF4F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoChipText: {
    fontSize: 12,
    color: JasTipColors.primary,
    fontWeight: '600',
  },
});
