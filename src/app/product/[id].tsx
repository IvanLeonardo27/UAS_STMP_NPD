import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { JasTipColors } from '@/constants/theme';
import { Item } from '@/types/jastip';
import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Modal Animasi Sukses Masuk Keranjang
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [lastAddedQty, setLastAddedQty] = useState(1);
  const [scaleAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    let active = true;
    (async () => {
      if (id) {
        const found = await api.getItemDetail(Number(id));
        if (active && found) {
          setItem(found);
          setQty(found.stok > 0 ? 1 : 0);
        }
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!item || item.stok <= 0) return;
    const addCount = Math.min(qty, item.stok);
    if (addCount <= 0) return;

    setIsAdding(true);
    setLastAddedQty(addCount);

    try {
      // 1. Simpan ke Keranjang & Kurangi stok di database/storage
      const { remainingStock } = await api.addToCart(item, addCount);

      // 2. Langsung kurangi sisa stok barang di tampilan layar seketika
      setItem((prev) => (prev ? { ...prev, stok: remainingStock } : null));

      // 3. Reset counter kuantitas
      setQty(remainingStock > 0 ? 1 : 0);

      // 4. Munculkan animasi pop-up sukses checkout ke keranjang
      setSuccessModalVisible(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.warn('Gagal menambah ke keranjang:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const closeSuccessModal = () => {
    setSuccessModalVisible(false);
    scaleAnim.setValue(0.3);
  };

  if (isLoading || !item) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={JasTipColors.primary} />
      </View>
    );
  }

  const formattedPrice = `Rp ${Number(item.harga).toLocaleString('id-ID')}`;
  const subtotalAdded = `Rp ${(Number(item.harga) * lastAddedQty).toLocaleString('id-ID')}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Image Hero with Back Button */}
        <View style={styles.heroContainer}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="cube-outline" size={64} color={JasTipColors.textMuted} />
            </View>
          )}

          {/* Floating Back Button */}
          <TouchableOpacity
            style={styles.floatingBackButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={JasTipColors.text} />
          </TouchableOpacity>
        </View>

        {/* Content Sheet */}
        <View style={styles.sheetContainer}>
          {/* Categories */}
          <View style={styles.badgeRow}>
            {item.category_list && item.category_list.length > 0 ? (
              item.category_list.map((c, idx) => (
                <View key={idx} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{c}</Text>
                </View>
              ))
            ) : (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>Umum</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{item.nama_barang}</Text>

          {/* Price & Real-time Stock */}
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formattedPrice}</Text>
            <View
              style={[
                styles.stockBadge,
                item.stok === 0 && { backgroundColor: '#FDECEC' },
              ]}
            >
              <Text
                style={[
                  styles.stockBadgeText,
                  item.stok === 0 && { color: '#D9383A', fontWeight: '700' },
                ]}
              >
                {item.stok > 0 ? `Sisa ${item.stok}` : 'Stok Habis'}
              </Text>
            </View>
          </View>

          {/* Jastiper Card */}
          <View style={styles.jastiperCard}>
            <View style={styles.jastiperAvatar}>
              <Ionicons name="person" size={20} color={JasTipColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jastiperName}>{item.jastiper_nama || 'Kevin · Jastiper'}</Text>
              <Text style={styles.tripDateText}>
                {item.nama_trip || 'Tokyo Spring Trip'} · 12-20 Apr
              </Text>
            </View>
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={16} color="#2B9A66" />
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionHeading}>Deskripsi</Text>
          <Text style={styles.descText}>
            {item.deskripsi ||
              'Kue pisang lembut isi custard khas Tokyo, dibeli di toko resmi bandara Haneda dan stasiun Tokyo.'}
          </Text>

          {/* Trip Details */}
          <Text style={styles.sectionHeading}>Detail Trip</Text>
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={JasTipColors.primary} />
              <Text style={styles.detailLabel}>Tujuan:</Text>
              <Text style={styles.detailValue}>{item.lokasi_tujuan || 'Tokyo, Jepang'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="airplane-outline" size={16} color={JasTipColors.primary} />
              <Text style={styles.detailLabel}>Status Trip:</Text>
              <Text style={styles.detailValue}>{item.trip_status || 'Live Trip Aktif'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty(Math.max(1, qty - 1))}
            disabled={item.stok <= 0}
          >
            <Text style={[styles.qtyBtnText, item.stok <= 0 && { color: JasTipColors.textMuted }]}>
              -
            </Text>
          </TouchableOpacity>
          <Text style={styles.qtyValueText}>{item.stok > 0 ? qty : 0}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQty(Math.min(item.stok, qty + 1))}
            disabled={item.stok <= 0 || qty >= item.stok}
          >
            <Text
              style={[
                styles.qtyBtnText,
                (item.stok <= 0 || qty >= item.stok) && { color: JasTipColors.textMuted },
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            item.stok <= 0 && styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={isAdding || item.stok <= 0}
          activeOpacity={0.8}
        >
          {isAdding ? (
            <ActivityIndicator color="#5C4505" />
          ) : (
            <View style={styles.addToCartRow}>
              <Ionicons
                name="cart"
                size={18}
                color={item.stok > 0 ? '#5C4505' : '#8A9CA8'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.addToCartButtonText,
                  item.stok <= 0 && { color: '#8A9CA8' },
                ]}
              >
                {item.stok > 0 ? 'Tambah ke keranjang' : 'Stok Habis'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL ANIMASI CHECKOUT BERHASIL MASUK KERANJANG */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSuccessModal}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View style={[styles.successCard, { transform: [{ scale: scaleAnim }] }]}>
            {/* Animated Check Icon */}
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-sharp" size={32} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Berhasil Masuk Keranjang!</Text>
            <Text style={styles.successSubtitle}>
              Barang telah ditambahkan dan stok otomatis dikurangi.
            </Text>

            {/* Item Summary Card */}
            <View style={styles.addedItemPreview}>
              {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={styles.previewThumb} />
              ) : (
                <Ionicons name="cube" size={24} color={JasTipColors.primary} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {item.nama_barang}
                </Text>
                <Text style={styles.previewDetail}>
                  {lastAddedQty}x · {subtotalAdded}
                </Text>
              </View>
              <View style={styles.sisaPill}>
                <Text style={styles.sisaPillText}>Sisa: {item.stok}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.continueShopBtn}
                onPress={closeSuccessModal}
                activeOpacity={0.8}
              >
                <Text style={styles.continueShopText}>Lanjut Belanja</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewCartBtn}
                onPress={() => {
                  closeSuccessModal();
                  router.push('/cart' as any);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={18} color="#5C4505" style={{ marginRight: 6 }} />
                <Text style={styles.viewCartText}>Lihat Keranjang</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#E7EFF4',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 48,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4505',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: JasTipColors.text,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: JasTipColors.primary,
  },
  stockBadge: {
    backgroundColor: '#EDF4F8',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    fontWeight: '600',
  },
  jastiperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EFF4',
    marginBottom: 20,
  },
  jastiperAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DDEEF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  jastiperName: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  tripDateText: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  verifiedChip: {
    padding: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 8,
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
    color: JasTipColors.textSecondary,
    marginBottom: 20,
  },
  detailBox: {
    backgroundColor: '#F8FBFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBF1F5',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2ECF2',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF3F7',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  qtyValueText: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: JasTipColors.accent,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonDisabled: {
    backgroundColor: '#EDF3F7',
  },
  addToCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4505',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  // Modal Style
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2B9A66',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: JasTipColors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  addedItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  previewDetail: {
    fontSize: 12,
    color: JasTipColors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  sisaPill: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sisaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4505',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  continueShopBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D8E5ED',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  continueShopText: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.textSecondary,
  },
  viewCartBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 12,
    backgroundColor: JasTipColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4505',
  },
});
