import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { ImagePickerSheet } from '@/components/common/ImagePickerSheet';
import { api } from '@/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ALL_CATEGORIES = ['Kuliner', 'Oleh-oleh', 'Kosmetik', 'Fashion', 'Elektronik'];

export default function ItemFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tripId?: string;
    namaTrip?: string;
    itemId?: string;
    namaBarang?: string;
    harga?: string;
    stok?: string;
    deskripsi?: string;
    fotoUrl?: string;
    from?: string;
  }>();

  const [namaBarang, setNamaBarang] = useState(params.namaBarang || '');
  const [harga, setHarga] = useState(params.harga || '');
  const [stok, setStok] = useState(params.stok || '10');
  const [deskripsi, setDeskripsi] = useState(params.deskripsi || '');
  const [fotoUrl, setFotoUrl] = useState(params.fotoUrl || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Kuliner']);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleImageSelected = async (base64: string, uri: string) => {
    setFotoUrl(uri);
    try {
      // Upload Base64 to server rubrik D
      const uploadedUrl = await api.uploadBase64Image('items', base64);
      setFotoUrl(uploadedUrl);
    } catch (e) {
      console.warn('Upload error:', e);
    }
  };

  const handleSave = async () => {
    if (!namaBarang.trim()) {
      Alert.alert('Perhatian', 'Nama barang wajib diisi.');
      return;
    }
    const numHarga = Number(harga.replace(/[^0-9]/g, ''));
    const numStok = Number(stok.replace(/[^0-9]/g, ''));

    if (!numHarga || numHarga <= 0) {
      Alert.alert('Perhatian', 'Harga barang tidak valid.');
      return;
    }

    setIsSaving(true);
    try {
      await api.saveItem({
        id: params.itemId ? Number(params.itemId) : undefined,
        trip_id: params.tripId ? Number(params.tripId) : 1,
        nama_trip: params.namaTrip,
        nama_barang: namaBarang.trim(),
        harga: numHarga,
        stok: numStok || 5,
        deskripsi: deskripsi.trim(),
        foto_url: fotoUrl || 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
        category_list: selectedCategories.length > 0 ? selectedCategories : ['Kuliner'],
      });

      if (Platform.OS === 'web') {
        window.alert('Barang berhasil disimpan dan ditambahkan ke trip.');
        if (params.from === 'edit-trip') {
          router.back();
        } else {
          router.replace('/(main)' as any);
        }
      } else {
        Alert.alert('Berhasil', 'Barang berhasil disimpan dan ditambahkan ke trip.', [
          {
            text: 'OK',
            onPress: () => {
              if (params.from === 'edit-trip') {
                router.back();
              } else {
                router.replace('/(main)' as any);
              }
            },
          },
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Gagal menyimpan barang.');
      } else {
        Alert.alert('Gagal', err.message || 'Gagal menyimpan barang.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title={params.itemId ? 'Edit Barang' : 'Tambah Barang'} showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Upload Foto Box (Dashed Area) */}
        <TouchableOpacity
          style={styles.dashedUploadBox}
          onPress={() => setIsPickerVisible(true)}
          activeOpacity={0.8}
        >
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={JasTipColors.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.uploadPromptText}>Pilih foto barang</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          <Text style={styles.fieldLabel}>Nama barang</Text>
          <TextInput
            style={styles.inputField}
            placeholder="mis. Tokyo Banana"
            placeholderTextColor={JasTipColors.textMuted}
            value={namaBarang}
            onChangeText={setNamaBarang}
          />

          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Harga (Rp)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="85000"
                placeholderTextColor={JasTipColors.textMuted}
                value={harga}
                onChangeText={setHarga}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Stok</Text>
              <TextInput
                style={styles.inputField}
                placeholder="12"
                placeholderTextColor={JasTipColors.textMuted}
                value={stok}
                onChangeText={setStok}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Deskripsi</Text>
          <TextInput
            style={[styles.inputField, styles.textArea]}
            placeholder="Kue pisang lembut isi custard khas Tokyo..."
            placeholderTextColor={JasTipColors.textMuted}
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            numberOfLines={3}
          />

          {/* Kategori Multi-Select */}
          <Text style={styles.fieldLabel}>Kategori (Dapat memilih lebih dari 1)</Text>
          <View style={styles.chipsWrap}>
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text
                    style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tombol Simpan */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Simpan barang</Text>
            )}
          </TouchableOpacity>

          {/* Tombol Hapus Barang (Jika Sedang Edit) */}
          {params.itemId && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={async () => {
                if (Platform.OS === 'web') {
                  const conf = window.confirm('Apakah kamu yakin ingin menghapus barang ini dari katalog?');
                  if (!conf) return;
                }
                await api.deleteItem(Number(params.itemId));
                if (Platform.OS === 'web') {
                  window.alert('Barang berhasil dihapus.');
                }
                router.replace('/(main)' as any);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#D9383A" style={{ marginRight: 6 }} />
              <Text style={styles.deleteButtonText}>Hapus barang</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal Bottom Sheet Kamera vs Galeri */}
      <ImagePickerSheet
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onImageSelected={handleImageSelected}
      />
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
  dashedUploadBox: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#B0C9D7',
    borderStyle: 'dashed',
    backgroundColor: '#EDF5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadPromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.primary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    backgroundColor: '#EDF4F8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D6E4ED',
  },
  categoryChipActive: {
    backgroundColor: JasTipColors.accent,
    borderColor: JasTipColors.accentDark,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#5C4505',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: JasTipColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F5B5B6',
    backgroundColor: '#FFF5F5',
    marginTop: 10,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D9383A',
  },
});
