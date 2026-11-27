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
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RequestScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [namaBarang, setNamaBarang] = useState('');
  const [perkiraanHarga, setPerkiraanHarga] = useState('');
  const [catatan, setCatatan] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelected = async (base64: string, uri: string) => {
    setFotoUrl(uri);
    try {
      const uploadedUrl = await api.uploadBase64Image('requests', base64);
      setFotoUrl(uploadedUrl);
    } catch (e) {
      console.warn('Upload error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!namaBarang.trim()) {
      Alert.alert('Perhatian', 'Nama barang wajib diisi.');
      return;
    }
    const numHarga = Number(perkiraanHarga.replace(/[^0-9]/g, ''));
    if (!numHarga || numHarga <= 0) {
      Alert.alert('Perhatian', 'Perkiraan harga tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const trips = await api.getTrips();
      const activeTrip = trips.find((t) => t.status === 'Live' || t.status === 'Aktif') || trips[0];

      await api.createRequest({
        user_id: user ? user.id : 2,
        trip_id: activeTrip ? activeTrip.id : 1,
        nama_barang: namaBarang.trim(),
        perkiraan_harga: numHarga,
        catatan: catatan.trim(),
        foto_referensi:
          fotoUrl ||
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
        pemohon_nama: user ? user.nama : 'Penitip',
        nama_trip: activeTrip ? activeTrip.nama_trip : 'Bangkok Snack & Beauty Hunt',
      });

      if (Platform.OS === 'web') {
        window.alert('Request Titipan Berhasil Dikirim!\n\nPesanan titipan kamu sudah diajukan ke Jastiper dan otomatis tampil di halaman Pesanan Saya.');
        router.replace('/(main)/orders' as any);
      } else {
        Alert.alert(
          'Request Dikirim!',
          'Permintaan titipan kamu telah diajukan ke Jastiper dan otomatis tampil di halaman Pesanan Saya.',
          [{ text: 'Lihat Pesanan', onPress: () => router.replace('/(main)/orders' as any) }]
        );
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Gagal mengirim request.');
      } else {
        Alert.alert('Gagal', err.message || 'Gagal mengirim request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Ajukan Request" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Banner Alert */}
        <View style={styles.bannerAlert}>
          <Ionicons name="information-circle-outline" size={18} color="#7A6014" style={{ marginRight: 8 }} />
          <Text style={styles.bannerText}>
            Barang belum ada di katalog? Ajukan ke jastiper.
          </Text>
        </View>

        {/* Upload Foto Referensi (Dashed Box) */}
        <TouchableOpacity
          style={styles.dashedUploadBox}
          onPress={() => setIsPickerVisible(true)}
          activeOpacity={0.8}
        >
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderCenter}>
              <Ionicons name="image-outline" size={32} color={JasTipColors.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.promptText}>Foto referensi</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.fieldLabel}>Nama barang</Text>
          <TextInput
            style={styles.inputField}
            placeholder="mis. Sushi Roll Mini"
            placeholderTextColor={JasTipColors.textMuted}
            value={namaBarang}
            onChangeText={setNamaBarang}
          />

          <Text style={styles.fieldLabel}>Perkiraan harga (Rp)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="90000"
            placeholderTextColor={JasTipColors.textMuted}
            value={perkiraanHarga}
            onChangeText={setPerkiraanHarga}
            keyboardType="numeric"
          />

          <Text style={styles.fieldLabel}>Catatan</Text>
          <TextInput
            style={[styles.inputField, styles.textArea]}
            placeholder="Varian rasa, ukuran, atau spesifikasi khusus..."
            placeholderTextColor={JasTipColors.textMuted}
            value={catatan}
            onChangeText={setCatatan}
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Kirim request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  bannerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF8E7',
    borderWidth: 1,
    borderColor: '#F5E2A8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#7A6014',
    fontWeight: '600',
  },
  dashedUploadBox: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#B0C9D7',
    borderStyle: 'dashed',
    backgroundColor: '#EDF5FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  placeholderCenter: {
    alignItems: 'center',
  },
  promptText: {
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
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitBtn: {
    backgroundColor: JasTipColors.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
