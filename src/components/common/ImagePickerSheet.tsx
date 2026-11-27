import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (base64: string, uri: string) => void;
}

export function ImagePickerSheet({ visible, onClose, onImageSelected }: ImagePickerSheetProps) {
  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin kamera untuk mengambil foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onImageSelected(asset.base64 || '', asset.uri);
        onClose();
      }
    } catch (err) {
      console.warn('Camera error:', err);
      Alert.alert('Error', 'Gagal membuka kamera.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin galeri untuk memilih foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onImageSelected(asset.base64 || '', asset.uri);
        onClose();
      }
    } catch (err) {
      console.warn('Gallery error:', err);
      Alert.alert('Error', 'Gagal membuka galeri.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.handleBar} />
              <Text style={styles.sheetTitle}>Ambil foto dari</Text>

              <TouchableOpacity style={styles.primaryOptionButton} onPress={pickFromCamera}>
                <Ionicons name="camera-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryOptionText}>Kamera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accentOptionButton} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={20} color="#5C4505" style={{ marginRight: 8 }} />
                <Text style={styles.accentOptionText}>Galeri</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#D0DCE3',
    borderRadius: 3,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  primaryOptionButton: {
    width: '100%',
    backgroundColor: JasTipColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  accentOptionButton: {
    width: '100%',
    backgroundColor: JasTipColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  accentOptionText: {
    color: '#5C4505',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelText: {
    color: JasTipColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
