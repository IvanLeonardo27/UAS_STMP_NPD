import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { BottomNavBar } from '@/components/common/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UserRole } from '@/types/jastip';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, logout, refreshUser } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editNama, setEditNama] = useState(user ? user.nama : 'Rani Wijaya');

  // Pastikan akun demo Rani kembali ke peran paten 'Penitip' jika sempat terubah sebelumnya
  useEffect(() => {
    if (user && user.email === 'rani@email.com' && (user.role !== 'Penitip' || role !== 'Penitip')) {
      const fixedUser = { ...user, role: 'Penitip' as UserRole };
      api.saveSession(fixedUser).then(() => {
        refreshUser();
      });
    }
  }, [user, role, refreshUser]);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setLogoutModalVisible(false);
      await logout();
      router.replace('/(auth)/login' as any);
    } catch (e) {
      console.warn('Logout error:', e);
      router.replace('/(auth)/login' as any);
    }
  };

  const displayName = user ? user.nama : 'Rani Wijaya';
  const displayEmail = user ? user.email : 'rani@email.com';
  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  const formattedSaldo = user ? `Rp ${Number(user.saldo).toLocaleString('id-ID')}` : 'Rp 0';
  const currentRole: UserRole = user ? user.role : role;

  return (
    <View style={styles.container}>
      <HeaderBar title="Profil" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{displayInitial}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
        </View>

        {/* Peran Aktif Card (Paten / Non-Switchable) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Peran aktif</Text>
            <View style={styles.patenTag}>
              <Ionicons name="lock-closed" size={11} color="#0D4B68" />
              <Text style={styles.patenTagText}>Paten</Text>
            </View>
          </View>

          <View style={styles.roleSwitchWrapper}>
            <View
              style={[
                styles.roleSwitchBtn,
                currentRole === 'Penitip' ? styles.roleSwitchBtnActive : styles.roleSwitchBtnDisabled,
              ]}
            >
              <Ionicons
                name="bag-handle-outline"
                size={16}
                color={currentRole === 'Penitip' ? '#FFFFFF' : '#8A9BA8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.roleSwitchText,
                  currentRole === 'Penitip' ? styles.roleSwitchTextActive : styles.roleSwitchTextDisabled,
                ]}
              >
                Penitip
              </Text>
            </View>

            <View
              style={[
                styles.roleSwitchBtn,
                currentRole === 'Jastiper' ? styles.roleSwitchBtnActive : styles.roleSwitchBtnDisabled,
              ]}
            >
              <Ionicons
                name="airplane-outline"
                size={16}
                color={currentRole === 'Jastiper' ? '#FFFFFF' : '#8A9BA8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.roleSwitchText,
                  currentRole === 'Jastiper' ? styles.roleSwitchTextActive : styles.roleSwitchTextDisabled,
                ]}
              >
                Jastiper
              </Text>
            </View>
          </View>
          <Text style={styles.roleHelperText}>
            Peran akun ini paten ({currentRole}) sesuai data pendaftaran dan tidak dapat diubah.
          </Text>
        </View>

        {/* Menu Items Card */}
        <View style={styles.menuCard}>
          {/* Saldo Item */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(main)/saldo' as any)}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="wallet-outline" size={20} color={JasTipColors.primary} />
            </View>
            <Text style={styles.menuLabel}>Saldo</Text>
            <Text style={styles.menuValue}>{formattedSaldo}</Text>
            <Ionicons name="chevron-forward" size={18} color={JasTipColors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          {/* Ubah Data Akun Item */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setEditModalVisible(true)}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="person-circle-outline" size={20} color={JasTipColors.primary} />
            </View>
            <Text style={styles.menuLabel}>Ubah data akun</Text>
            <Ionicons name="chevron-forward" size={18} color={JasTipColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#D9383A" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Edit Data Akun */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Data Akun</Text>
            <Text style={styles.fieldLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.inputField}
              value={editNama}
              onChangeText={setEditNama}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={async () => {
                  if (user) {
                    await api.saveSession({ ...user, nama: editNama });
                    await refreshUser();
                  }
                  setEditModalVisible(false);
                  Alert.alert('Sukses', 'Data akun berhasil diperbarui.');
                }}
              >
                <Text style={styles.modalSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Konfirmasi Logout (Kompatibel Web & Mobile) */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.logoutModalIconBox}>
              <Ionicons name="log-out-outline" size={32} color="#D9383A" />
            </View>
            <Text style={styles.modalTitleCentered}>Konfirmasi Keluar</Text>
            <Text style={styles.logoutModalDesc}>
              Apakah kamu yakin ingin keluar dari akun JasTipGo?
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalLogoutConfirmBtn}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalLogoutConfirmText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JasTipColors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: JasTipColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5C4505',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  patenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F3F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  patenTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4B68',
  },
  roleSwitchWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EDF3F7',
    borderRadius: 12,
    padding: 4,
  },
  roleSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  roleSwitchBtnActive: {
    backgroundColor: JasTipColors.primary,
  },
  roleSwitchBtnDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.45,
  },
  roleSwitchText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  roleSwitchTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  roleSwitchTextDisabled: {
    color: '#8A9BA8',
    fontWeight: '500',
  },
  roleHelperText: {
    fontSize: 11,
    color: JasTipColors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDF4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: JasTipColors.text,
  },
  menuValue: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.primary,
    marginRight: 6,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F5F8',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F3B5B6',
    backgroundColor: '#FFF7F7',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9383A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
    marginBottom: 6,
  },
  inputField: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
    color: JasTipColors.text,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: JasTipColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutModalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitleCentered: {
    fontSize: 17,
    fontWeight: '800',
    color: JasTipColors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  logoutModalDesc: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalLogoutConfirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#D9383A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogoutConfirmText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
