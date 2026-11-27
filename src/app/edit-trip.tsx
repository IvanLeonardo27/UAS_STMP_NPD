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
import { Item, Trip } from '@/types/jastip';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EditTripScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [currentId, setCurrentId] = useState<number>(tripId ? Number(tripId) : 1);
  const [namaTrip, setNamaTrip] = useState('');
  const [lokasiTujuan, setLokasiTujuan] = useState('');
  const [tglBerangkat, setTglBerangkat] = useState('12/04/2026');
  const [tglKembali, setTglKembali] = useState('20/04/2026');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const trips = await api.getTrips();
      const targetTrip: Trip | undefined = tripId
        ? trips.find((t) => String(t.id) === String(tripId)) || trips[0]
        : trips[0];

      if (targetTrip) {
        setCurrentId(targetTrip.id);
        setNamaTrip(targetTrip.nama_trip);
        setLokasiTujuan(targetTrip.lokasi_tujuan);
        setTglBerangkat(targetTrip.tgl_berangkat);
        setTglKembali(targetTrip.tgl_kembali);

        const catalog = await api.getCatalog();
        const tripItems = catalog.filter(
          (i) =>
            String(i.trip_id) === String(targetTrip.id) ||
            (i.nama_trip && i.nama_trip.trim().toLowerCase() === targetTrip.nama_trip.trim().toLowerCase())
        );
        setItems(tripItems);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateTrip({
        id: currentId,
        user_id: 1,
        nama_trip: namaTrip,
        lokasi_tujuan: lokasiTujuan,
        tgl_berangkat: tglBerangkat,
        tgl_kembali: tglKembali,
        status: 'Live',
      });
      if (Platform.OS === 'web') {
        window.alert('Perubahan data trip berhasil disimpan.');
        router.replace('/(main)' as any);
      } else {
        Alert.alert('Berhasil', 'Perubahan data trip berhasil disimpan.', [
          { text: 'OK', onPress: () => router.replace('/(main)' as any) },
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Gagal menyimpan perubahan.');
      } else {
        Alert.alert('Gagal', err.message || 'Gagal menyimpan perubahan.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={JasTipColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="Edit Trip" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Notice Pre-filled Banner */}
        <View style={styles.noticeBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#7A6014" style={{ marginRight: 6 }} />
          <Text style={styles.noticeText}>
            Data terisi otomatis dari server. Ubah lalu simpan.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.fieldLabel}>Nama trip</Text>
          <TextInput
            style={styles.inputField}
            value={namaTrip}
            onChangeText={setNamaTrip}
          />

          <Text style={styles.fieldLabel}>Lokasi tujuan</Text>
          <TextInput
            style={styles.inputField}
            value={lokasiTujuan}
            onChangeText={setLokasiTujuan}
          />

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Berangkat</Text>
              <TextInput
                style={styles.inputField}
                value={tglBerangkat}
                onChangeText={setTglBerangkat}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Kembali</Text>
              <TextInput
                style={styles.inputField}
                value={tglKembali}
                onChangeText={setTglKembali}
              />
            </View>
          </View>

          {/* Barang di Trip Ini */}
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Barang di trip ini</Text>
          <View style={styles.itemsBox}>
            {items.length === 0 ? (
              <View style={styles.emptyItemsBox}>
                <Ionicons name="cube-outline" size={26} color={JasTipColors.textMuted} style={{ marginBottom: 6 }} />
                <Text style={styles.emptyItemsTitle}>Belum ada barang di trip ini</Text>
                <Text style={styles.emptyItemsSub}>
                  Trip ini baru dibuat dan belum memiliki barang titipan. Klik tombol di bawah untuk menambahkan barang ke trip ini.
                </Text>
              </View>
            ) : (
              items.map((it) => (
                <View key={it.id} style={styles.itemRow}>
                  <View style={styles.itemIconBox}>
                    <Ionicons name="cube-outline" size={18} color={JasTipColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemRowTitle}>{it.nama_barang}</Text>
                    <Text style={styles.itemRowSub}>
                      Rp {Number(it.harga).toLocaleString('id-ID')} · stok {it.stok}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/item-form',
                        params: {
                          itemId: String(it.id),
                          tripId: String(currentId),
                          namaTrip: namaTrip,
                          namaBarang: it.nama_barang,
                          harga: String(it.harga),
                          stok: String(it.stok),
                          deskripsi: it.deskripsi,
                          fotoUrl: it.foto_url,
                          from: 'edit-trip',
                        },
                      } as any)
                    }
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="create-outline" size={18} color={JasTipColors.primary} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Tombol Tambah Barang ke Trip Ini */}
            <TouchableOpacity
              style={styles.addBarangBtn}
              onPress={() =>
                router.push({
                  pathname: '/item-form',
                  params: {
                    tripId: String(currentId),
                    namaTrip: namaTrip,
                    from: 'edit-trip',
                  },
                } as any)
              }
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={JasTipColors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.addBarangBtnText}>Tambah barang ke trip ini</Text>
            </TouchableOpacity>
          </View>

          {/* Simpan Perubahan Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Simpan perubahan</Text>
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
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF8E7',
    borderWidth: 1,
    borderColor: '#F5E2A8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#7A6014',
    lineHeight: 16,
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
  },
  itemsBox: {
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 20,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EBF1F5',
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.text,
  },
  itemRowSub: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  emptyItemsBox: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  emptyItemsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.textSecondary,
    marginBottom: 4,
  },
  emptyItemsSub: {
    fontSize: 11,
    color: JasTipColors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  addBarangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: JasTipColors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  addBarangBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.primary,
  },
  saveBtn: {
    backgroundColor: JasTipColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
