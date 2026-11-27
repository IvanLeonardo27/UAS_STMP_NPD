import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { CartItem } from '@/types/jastip';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const items = await api.getCart();
      setCart(items);
    } catch (e) {
      console.warn('loadCart error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCart();
      refreshUser();
    }, [loadCart, refreshUser])
  );

  const handleToggleSelect = (itemId: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdateQty = async (itemId: number, delta: number) => {
    const updated = await api.updateCartQty(itemId, delta);
    setCart(updated);
  };

  const selectedItems = cart.filter((it) => it.selected !== false);
  const totalPrice = selectedItems.reduce((sum, it) => sum + it.harga * it.qty, 0);
  const formattedTotal = `Rp ${totalPrice.toLocaleString('id-ID')}`;

  const handleCheckout = async () => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Perhatian: Silakan login terlebih dahulu.');
      } else {
        Alert.alert('Perhatian', 'Silakan login terlebih dahulu.');
      }
      return;
    }

    if (selectedItems.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Keranjang Kosong: Pilih minimal satu barang untuk di-checkout.');
      } else {
        Alert.alert('Keranjang Kosong', 'Pilih minimal satu barang untuk di-checkout.');
      }
      return;
    }

    const userSaldo = user?.saldo ?? 0;
    if (userSaldo < totalPrice) {
      const diff = totalPrice - userSaldo;
      if (Platform.OS === 'web') {
        const goToTopup = window.confirm(
          `❌ Gagal Checkout: Saldo Tidak Mencukupi!\n\nSaldo kamu: Rp ${userSaldo.toLocaleString('id-ID')}\nTotal belanja: ${formattedTotal}\nKurang: Rp ${diff.toLocaleString('id-ID')}\n\nApakah kamu ingin menuju halaman Top Up saldo sekarang?`
        );
        if (goToTopup) {
          router.push('/(main)/saldo' as any);
        }
      } else {
        Alert.alert(
          'Saldo Tidak Mencukupi',
          `Saldo kamu (Rp ${userSaldo.toLocaleString('id-ID')}) tidak mencukupi untuk pembayaran sebesar ${formattedTotal}.\n\nKurang: Rp ${diff.toLocaleString('id-ID')}`,
          [
            { text: 'Top Up Sekarang', onPress: () => router.push('/(main)/saldo' as any) },
            { text: 'Batal', style: 'cancel' },
          ]
        );
      }
      return;
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Konfirmasi Checkout:\n\nBayar ${formattedTotal} menggunakan saldo JasTipGo?`);
      if (confirmed) {
        setIsCheckingOut(true);
        try {
          const newOrder = await api.checkoutWithSaldo(user, selectedItems, totalPrice);
          await refreshUser();
          await loadCart();
          window.alert(`Checkout Berhasil!\n\nPesanan ${newOrder.order_code} telah dibuat.`);
          router.replace('/(main)/orders' as any);
        } catch (err: any) {
          window.alert(err.message || 'Checkout gagal diproses.');
        } finally {
          setIsCheckingOut(false);
        }
      }
      return;
    }

    Alert.alert(
      'Konfirmasi Checkout',
      `Bayar ${formattedTotal} menggunakan saldo JasTipGo?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bayar Sekarang',
          onPress: async () => {
            setIsCheckingOut(true);
            try {
              const newOrder = await api.checkoutWithSaldo(user, selectedItems, totalPrice);
              await refreshUser();
              await loadCart();
              Alert.alert('Checkout Berhasil!', `Pesanan ${newOrder.order_code} telah dibuat.`, [
                {
                  text: 'Lihat Pesanan',
                  onPress: () => router.replace('/(main)/orders' as any),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Gagal', err.message || 'Checkout gagal diproses.');
            } finally {
              setIsCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isSelected = item.selected !== false;
    const formattedPrice = `Rp ${Number(item.harga).toLocaleString('id-ID')}`;

    return (
      <View style={styles.cardItem}>
        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleSelect(item.item_id)}
        >
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={isSelected ? JasTipColors.primary : JasTipColors.textMuted}
          />
        </TouchableOpacity>

        {/* Thumbnail */}
        <View style={styles.thumbnailBox}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <Ionicons name="cube-outline" size={24} color={JasTipColors.textMuted} />
          )}
        </View>

        {/* Item Info */}
        <View style={styles.infoCol}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.nama_barang}
          </Text>
          <Text style={styles.itemPrice}>{formattedPrice}</Text>
        </View>

        {/* Qty Counter */}
        <View style={styles.counterBox}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => handleUpdateQty(item.item_id, -1)}
          >
            <Text style={styles.counterBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterValue}>{item.qty}</Text>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => handleUpdateQty(item.item_id, 1)}
          >
            <Text style={styles.counterBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Hapus Item Button */}
        <TouchableOpacity
          style={styles.trashBtn}
          onPress={async () => {
            const updated = await api.removeCartItem(item.item_id);
            setCart(updated);
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#D9383A" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Keranjang" showBack />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={JasTipColors.primary} />
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => String(item.item_id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderCartItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={56} color={JasTipColors.textMuted} />
              <Text style={styles.emptyTitle}>Keranjang kamu masih kosong</Text>
              <Text style={styles.emptySubtitle}>
                Yuk jelajahi barang-barang titipan menarik dari jastiper kami!
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.replace('/(main)' as any)}
              >
                <Text style={styles.browseButtonText}>Mulai Belanja</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Bottom Sticky Checkout Bar */}
      {cart.length > 0 && (
        <View style={styles.bottomCheckoutBar}>
          {user && user.saldo < totalPrice && (
            <View style={styles.saldoWarningCard}>
              <View style={styles.saldoWarningHeader}>
                <Ionicons name="warning" size={16} color="#D32F2F" style={{ marginRight: 6 }} />
                <Text style={styles.saldoWarningTitle}>Saldo Tidak Mencukupi</Text>
              </View>
              <Text style={styles.saldoWarningText}>
                Saldo kamu: <Text style={{ fontWeight: '700' }}>Rp {user.saldo.toLocaleString('id-ID')}</Text> (Kurang <Text style={{ fontWeight: '700', color: '#D32F2F' }}>Rp {(totalPrice - user.saldo).toLocaleString('id-ID')}</Text>)
              </Text>
              <TouchableOpacity
                style={styles.topupBtn}
                onPress={() => router.push('/(main)/saldo' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.topupBtnText}>Top Up Saldo Sekarang</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formattedTotal}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              user && user.saldo < totalPrice && styles.checkoutBtnInsufficient,
            ]}
            onPress={handleCheckout}
            disabled={isCheckingOut}
            activeOpacity={0.8}
          >
            {isCheckingOut ? (
              <ActivityIndicator color="#5C4505" />
            ) : (
              <Text style={styles.checkoutBtnText}>Checkout dengan saldo</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JasTipColors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2ECF2',
  },
  checkbox: {
    paddingRight: 10,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEF4F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  itemPrice: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2F7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  counterBtn: {
    width: 26,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  counterValue: {
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  trashBtn: {
    paddingLeft: 10,
    paddingRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saldoWarningCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  saldoWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  saldoWarningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D32F2F',
  },
  saldoWarningText: {
    fontSize: 11,
    color: '#4A5568',
    lineHeight: 16,
    marginBottom: 8,
  },
  topupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  topupBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkoutBtnInsufficient: {
    opacity: 0.85,
  },
  bottomCheckoutBar: {
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
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: JasTipColors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  checkoutBtn: {
    backgroundColor: JasTipColors.accent,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4505',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: JasTipColors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: JasTipColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
