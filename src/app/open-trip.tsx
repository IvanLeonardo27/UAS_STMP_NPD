import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { api } from '@/services/api';
import { Item } from '@/types/jastip';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function OpenTripScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [tempTripId] = useState(() => Date.now());
  const [namaTrip, setNamaTrip] = useState('');
  const [lokasiTujuan, setLokasiTujuan] = useState('');
  const [tglBerangkat, setTglBerangkat] = useState('12/04/2026');
  const [tglKembali, setTglKembali] = useState('20/04/2026');
  const [tripItems, setTripItems] = useState<Item[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saat buat trip baru, katalog barang trip diawali dalam keadaan KOSONG (0 barang).
  // Hanya barang yang ditambahkan untuk tripId ini yang akan muncul di daftar.
  const loadTripItems = useCallback(async () => {
    const catalog = await api.getCatalog();
    const itemsForThisTrip = catalog.filter((i) => i.trip_id === tempTripId);
    setTripItems(itemsForThisTrip);
  }, [tempTripId]);

  useFocusEffect(
    useCallback(() => {
      loadTripItems();
    }, [loadTripItems])
  );

  const handleOpenTrip = async () => {
    if (!namaTrip.trim() || !lokasiTujuan.trim()) {
      Alert.alert('Perhatian', 'Nama trip dan lokasi tujuan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createTrip({
        id: tempTripId,
        user_id: user ? user.id : 1,
        nama_trip: namaTrip.trim(),
        lokasi_tujuan: lokasiTujuan.trim(),
        tgl_berangkat: tglBerangkat,
        tgl_kembali: tglKembali,
      });

      if (Platform.OS === 'web') {
        window.alert('Open Trip berhasil dibuka!');
        router.replace('/(main)' as any);
      } else {
        Alert.alert('Berhasil', 'Open Trip berhasil dibuka!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(main)' as any),
          },
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Gagal membuka trip.');
      } else {
        Alert.alert('Gagal', err.message || 'Gagal membuka trip.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Buka Trip Baru" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <Text style={styles.fieldLabel}>Nama trip</Text>
          <TextInput
            style={styles.inputField}
            placeholder="mis. Tokyo Spring Trip"
            placeholderTextColor={JasTipColors.textMuted}
            value={namaTrip}
            onChangeText={setNamaTrip}
          />

          <Text style={styles.fieldLabel}>Lokasi tujuan</Text>
          <TextInput
            style={styles.inputField}
            placeholder="mis. Tokyo, Jepang"
            placeholderTextColor={JasTipColors.textMuted}
            value={lokasiTujuan}
            onChangeText={setLokasiTujuan}
          />

          {/* Date Row */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Berangkat</Text>
              <View style={styles.dateInputBox}>
                <Ionicons name="calendar-outline" size={16} color={JasTipColors.primary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.dateText}
                  value={tglBerangkat}
                  onChangeText={setTglBerangkat}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Kembali</Text>
              <View style={styles.dateInputBox}>
                <Ionicons name="calendar-outline" size={16} color={JasTipColors.primary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.dateText}
                  value={tglKembali}
                  onChangeText={setTglKembali}
                />
              </View>
            </View>
          </View>

          {/* Katalog Barang Trip */}
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Katalog barang trip</Text>
          <View style={styles.itemsListContainer}>
            {tripItems.length === 0 ? (
              <View style={styles.emptyCatalogBox}>
                <Ionicons name="cube-outline" size={26} color={JasTipColors.textMuted} style={{ marginBottom: 4 }} />
                <Text style={styles.emptyCatalogTitle}>Belum ada barang di trip ini</Text>
                <Text style={styles.emptyCatalogSubtitle}>
                  Klik tombol di bawah untuk menambahkan barang titipan ke trip baru ini.
                </Text>
              </View>
            ) : (
              tripItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemIconBox}>
                    <Ionicons name="cube-outline" size={18} color={JasTipColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemRowTitle}>{item.nama_barang}</Text>
                    <Text style={styles.itemRowSub}>
                      Rp {Number(item.harga).toLocaleString('id-ID')} · stok {item.stok}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/item-form',
                        params: {
                          itemId: String(item.id),
                          tripId: String(tempTripId),
                          namaBarang: item.nama_barang,
                          harga: String(item.harga),
                          stok: String(item.stok),
                          deskripsi: item.deskripsi,
                          fotoUrl: item.foto_url,
                        },
                      } as any)
                    }
                  >
                    <Ionicons name="create-outline" size={18} color={JasTipColors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Tombol Tambah Barang */}
            <TouchableOpacity
              style={styles.addBarangBtn}
              onPress={() =>
                router.push({
                  pathname: '/item-form',
                  params: { tripId: String(tempTripId) },
                } as any)
              }
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={JasTipColors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.addBarangBtnText}>Tambah barang</Text>
            </TouchableOpacity>
          </View>

          {/* Tombol Buka Trip */}
          <TouchableOpacity
            style={styles.submitTripBtn}
            onPress={handleOpenTrip}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitTripBtnText}>Buka trip</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2ECF2',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.text,
    marginBottom: 6,
  },
  inputField: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: JasTipColors.text,
    backgroundColor: '#FBFDFE',
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E5ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#FBFDFE',
  },
  dateText: {
    flex: 1,
    fontSize: 13,
    color: JasTipColors.text,
  },
  itemsListContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 20,
  },
  emptyCatalogBox: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCatalogTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 2,
  },
  emptyCatalogSubtitle: {
    fontSize: 11,
    color: JasTipColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 16,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAF0F4',
  },
  itemIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EAF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  itemRowSub: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  addBarangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: JasTipColors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
  },
  addBarangBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.primary,
  },
  submitTripBtn: {
    backgroundColor: JasTipColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitTripBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
