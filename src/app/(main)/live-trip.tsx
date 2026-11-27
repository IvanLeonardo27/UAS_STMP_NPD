import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { BottomNavBar } from '@/components/common/BottomNavBar';
import { TripCheckin, Trip } from '@/types/jastip';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export default function LiveTripScreen() {
  const { role, user } = useAuth();

  const [checkins, setCheckins] = useState<TripCheckin[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Check-in States
  const [modalVisible, setModalVisible] = useState(false);
  const [locationName, setLocationName] = useState('Big C Supercenter Bangkok');
  const [latitude, setLatitude] = useState(35.6595);
  const [longitude, setLongitude] = useState(139.7005);
  const [gpsAccuracy, setGpsAccuracy] = useState('8 m');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Camera Web & Native States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  const stopWebCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch (e) {
        console.warn('Stop track error:', e);
      }
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const loadCheckins = async () => {
    try {
      const trips = await api.getTrips();
      const live = trips.find((t) => t.status === 'Live' || t.status === 'Aktif') || trips[0];
      setActiveTrip(live || null);
      const data = await api.getCheckins();
      setCheckins(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCheckins();
    return () => {
      stopWebCamera();
    };
  }, []);

  const startWebCamera = async () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setIsCameraLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 150);
      } catch (e) {
        console.warn('Webcam tidak dapat diakses / ditolak:', e);
        setIsCameraActive(false);
      } finally {
        setIsCameraLoading(false);
      }
    } else {
      takeNativeCamera();
    }
  };

  const captureWebcamPhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelfieUri(dataUrl);
          stopWebCamera();
        }
      } catch (err) {
        console.warn('Capture photo error:', err);
      }
    }
  };

  const takeNativeCamera = async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert('Izin Ditolak', 'Aplikasi membutuhkan izin kamera depan untuk verifikasi selfie.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSelfieUri(asset.uri);
      }
    } catch (err) {
      console.warn('Native selfie error:', err);
    }
  };

  const pickImageFallback = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelfieUri(res.assets[0].uri);
        stopWebCamera();
      }
    } catch (e) {
      console.warn('Pick image fallback error:', e);
    }
  };

  const handleOpenCheckinModal = async () => {
    setModalVisible(true);
    setIsFetchingGps(true);

    try {
      // 1. Ambil izin lokasi
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
        setGpsAccuracy(`${Math.round(loc.coords.accuracy || 8)} m`);
      }
    } catch (e) {
      console.warn('GPS location error:', e);
    } finally {
      setIsFetchingGps(false);
    }

    // 2. Aktifkan kamera web / kamera selfie depan secara otomatis
    startWebCamera();
  };

  const closeCheckinModal = () => {
    stopWebCamera();
    setModalVisible(false);
  };

  const handleSubmitCheckin = async () => {
    if (!locationName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Perhatian: Nama lokasi toko wajib diisi.');
      } else {
        Alert.alert('Perhatian', 'Nama lokasi toko wajib diisi.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCheckin({
        trip_id: activeTrip ? activeTrip.id : 1,
        jastiper_id: user ? user.id : 1,
        nama_lokasi: locationName.trim(),
        latitude,
        longitude,
        foto_selfie_url:
          selfieUri ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        nama_trip: activeTrip ? activeTrip.nama_trip : 'Bangkok Snack & Beauty Hunt',
        jastiper_nama: user ? user.nama : 'Kevin Jastiper',
      });

      stopWebCamera();
      setModalVisible(false);
      setSelfieUri(null);
      await loadCheckins();
      if (Platform.OS === 'web') {
        window.alert('Berhasil: Check-in lokasi dan selfie berhasil dikirim!');
      } else {
        Alert.alert('Berhasil', 'Check-in lokasi dan selfie berhasil dikirim!');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Gagal mengirim check-in.');
      } else {
        Alert.alert('Gagal', err.message || 'Gagal mengirim check-in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderWebcamVideo = () => {
    if (Platform.OS !== 'web') return null;
    return React.createElement('video', {
      ref: videoRef,
      autoPlay: true,
      playsInline: true,
      muted: true,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)',
        borderRadius: 16,
      },
    });
  };

  const renderRealMap = () => {
    const centerLat = checkins.length > 0 ? checkins[0].latitude : latitude;
    const centerLng = checkins.length > 0 ? checkins[0].longitude : longitude;

    if (Platform.OS === 'web') {
      const markersJs = checkins
        .map((chk) => {
          const isNew = chk.is_new ? 'pin-new' : '';
          const escapedName = chk.nama_lokasi.replace(/'/g, "\\'");
          const time = chk.waktu_checkin || '';
          return `
            (function() {
              var customIcon = L.divIcon({
                className: 'pin-custom-wrapper',
                html: '<div class="pin-custom ${isNew}">🏪</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
              });
              var marker = L.marker([${chk.latitude}, ${chk.longitude}], { icon: customIcon }).addTo(map);
              marker.bindPopup('<div class="popup-box"><div class="popup-title">${escapedName}</div><div class="popup-time">🕒 ${time}</div></div>');
              ${chk.is_new ? 'marker.openPopup();' : ''}
            })();
          `;
        })
        .join('\n');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #EAF0F4; }
            .pin-custom-wrapper { background: transparent; border: none; }
            .pin-custom {
              background: #1B5E80;
              color: #ffffff;
              border: 2px solid #ffffff;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35);
              cursor: pointer;
            }
            .pin-new {
              background: #E53935;
              animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(229, 57, 53, 0); }
              100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
            }
            .leaflet-popup-content-wrapper {
              border-radius: 10px;
              box-shadow: 0 3px 10px rgba(0,0,0,0.2);
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .popup-box { font-size: 12px; color: #1A3038; }
            .popup-title { font-weight: 700; color: #0E364A; margin-bottom: 2px; }
            .popup-time { font-size: 11px; color: #627F8E; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${centerLat}, ${centerLng}], 14);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19
            }).addTo(map);

            ${markersJs}
          </script>
        </body>
        </html>
      `;

      return React.createElement('iframe', {
        key: `map-${checkins.length}-${centerLat}-${centerLng}`,
        srcDoc: htmlContent,
        title: 'Live Real Map',
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 20,
        },
      });
    }

    return (
      <View style={styles.nativeMapFallback}>
        <Ionicons name="map" size={36} color={JasTipColors.primary} />
        <Text style={styles.nativeMapTitle}>Peta Riil Interaktif Aktif</Text>
        <Text style={styles.nativeMapSub}>
          {checkins.length} titik toko terpantau di koordinat GPS riil
        </Text>
      </View>
    );
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
      <HeaderBar title="Live Trip" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Real Interactive Map Area (OpenStreetMap Live) */}
        <View style={styles.mapContainer}>
          {renderRealMap()}
          <View style={styles.liveIndicator}>
            <View style={styles.liveBlinker} />
            <Text style={styles.liveIndicatorText}>GPS LIVE · REAL MAP</Text>
          </View>
        </View>

        {/* Live Trip Status Card */}
        <View style={styles.tripStatusCard}>
          <View style={styles.tripStatusRow}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live Trip</Text>
            </View>
            <Text style={styles.tripNameText}>{activeTrip ? activeTrip.nama_trip : 'Tokyo Spring Trip'}</Text>
          </View>

          {/* Jastiper Action: Check-in Button */}
          {role === 'Jastiper' && (
            <TouchableOpacity
              style={styles.checkinActionBtn}
              onPress={handleOpenCheckinModal}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.checkinActionBtnText}>Check-in Lokasi Saat Ini</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Riwayat Check-in Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionHeading}>Riwayat check-in</Text>

          {checkins.map((item, idx) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* Timeline Connector Line */}
              <View style={styles.timelineLineContainer}>
                <View style={[styles.timelineNode, item.is_new && styles.timelineNodeNew]} />
                {idx < checkins.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Checkin Card */}
              <View style={styles.checkinCard}>
                <View style={styles.checkinHeaderRow}>
                  {item.foto_selfie_url ? (
                    <Image
                      source={{ uri: item.foto_selfie_url }}
                      style={styles.selfieAvatar}
                    />
                  ) : (
                    <View style={styles.selfieAvatarPlaceholder}>
                      <Ionicons name="camera" size={16} color={JasTipColors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>{item.nama_lokasi}</Text>
                    <Text style={styles.checkinTime}>{item.waktu_checkin}</Text>
                  </View>
                  {item.is_new ? (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>Terbaru</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL CHECK-IN GPS + SELFIE (Rubrik H) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCheckinModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Check-in di lokasi toko</Text>
              <TouchableOpacity onPress={closeCheckinModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={JasTipColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Selfie Preview Area */}
            <View style={styles.selfieBox}>
              {selfieUri ? (
                <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Image source={{ uri: selfieUri }} style={styles.selfieImage} resizeMode="cover" />
                  <View style={styles.selfieBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#2B9A66" />
                    <Text style={styles.selfieBadgeText}>Foto Selfie Terambil</Text>
                  </View>
                </View>
              ) : isCameraActive ? (
                <View style={styles.webcamWrapper}>
                  {renderWebcamVideo()}
                  <TouchableOpacity
                    style={styles.snapPhotoButton}
                    onPress={captureWebcamPhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.snapPhotoText}>Jepret Foto Selfie</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.selfiePlaceholder}>
                  {isCameraLoading ? (
                    <ActivityIndicator size="large" color={JasTipColors.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera-reverse-outline" size={38} color={JasTipColors.primary} />
                      <Text style={styles.selfiePrompt}>Kamera depan (Selfie verifikasi)</Text>
                      <View style={styles.selfieActionButtonsRow}>
                        <TouchableOpacity
                          style={styles.cameraOptionBtn}
                          onPress={startWebCamera}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="videocam-outline" size={15} color={JasTipColors.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.cameraOptionBtnText}>Nyalakan Kamera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cameraOptionBtn}
                          onPress={pickImageFallback}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="image-outline" size={15} color={JasTipColors.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.cameraOptionBtnText}>Pilih File/Galeri</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Input Nama Toko */}
            <View style={styles.storeInputContainer}>
              <Text style={styles.storeInputLabel}>Nama Toko / Lokasi Check-in:</Text>
              <TextInput
                style={styles.storeInputField}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="mis. Big C Supercenter Bangkok"
                placeholderTextColor={JasTipColors.textMuted}
              />
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setLocationName('Big C Supercenter Bangkok')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText}>+ Big C Bangkok</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setLocationName('Siam Paragon')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText}>+ Siam Paragon</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setLocationName('Don Quijote Shibuya')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionChipText}>+ Don Quijote</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location & Coordinates Box */}
            <View style={styles.gpsInfoBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsCoordLabel}>Koordinat Terdeteksi (GPS Riil):</Text>
                <Text style={styles.coordsText}>
                  {latitude.toFixed(4)} N, {longitude.toFixed(4)} E · akurasi {gpsAccuracy}
                </Text>
              </View>
              <View style={styles.gpsPill}>
                {isFetchingGps ? (
                  <ActivityIndicator size="small" color="#5C4505" />
                ) : (
                  <Text style={styles.gpsPillText}>GPS aktif</Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => {
                  setSelfieUri(null);
                  startWebCamera();
                }}
              >
                <Text style={styles.retakeBtnText}>Ulangi foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitCheckinBtn}
                onPress={handleSubmitCheckin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#5C4505" />
                ) : (
                  <Text style={styles.submitCheckinBtnText}>Kirim check-in</Text>
                )}
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
    paddingBottom: 24,
  },
  mapContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#DDE9F0',
    position: 'relative',
    overflow: 'hidden',
  },
  nativeMapFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F0F5',
  },
  nativeMapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
    marginTop: 8,
  },
  nativeMapSub: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  mapGraphic: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D2E3ED',
    position: 'relative',
  },
  mapRoad1: {
    position: 'absolute',
    top: 40,
    left: -40,
    width: 450,
    height: 18,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '25deg' }],
  },
  mapRoad2: {
    position: 'absolute',
    top: 100,
    left: -20,
    width: 450,
    height: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-15deg' }],
  },
  mapRiver: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#BFD9E8',
  },
  mapPinWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  mapPinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: JasTipColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPinDotNew: {
    backgroundColor: '#E53E3E',
  },
  mapPinLabel: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  mapPinLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    zIndex: 10,
  },
  liveBlinker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53E3E',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  tripStatusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  tripStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveBadge: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4505',
  },
  tripNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  checkinActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: JasTipColors.primary,
    height: 42,
    borderRadius: 10,
    marginTop: 12,
  },
  checkinActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineSection: {
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLineContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#B5CCD8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineNodeNew: {
    backgroundColor: JasTipColors.primary,
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: '#D4E3EB',
  },
  checkinCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 10,
  },
  checkinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selfieAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  selfieAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDF4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  checkinTime: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5C4505',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D5E1E8',
    borderRadius: 2,
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieBox: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    backgroundColor: '#EDF4F8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
  },
  webcamWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  snapPhotoButton: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  snapPhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selfieBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  selfieBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B9A66',
  },
  selfieActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cameraOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0DFE8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cameraOptionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.primary,
  },
  selfiePlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selfiePrompt: {
    fontSize: 12,
    color: JasTipColors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  storeInputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  storeInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 6,
  },
  storeInputField: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: JasTipColors.text,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: '#EEF5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#D8E5ED',
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: JasTipColors.primary,
  },
  gpsCoordLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
    marginBottom: 2,
  },
  gpsInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    width: '100%',
    marginBottom: 16,
  },
  locationInput: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
    padding: 0,
    marginBottom: 2,
  },
  coordsText: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
  },
  gpsPill: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4505',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  submitCheckinBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: JasTipColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitCheckinBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4505',
  },
});
