import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { BottomNavBar } from '@/components/common/BottomNavBar';
import { Item } from '@/types/jastip';
import { api } from '@/services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Semua', 'Kuliner', 'Oleh-oleh', 'Kosmetik', 'Fashion'];

export default function CatalogScreen() {
  const router = useRouter();
  const { role } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // useFocusEffect agar badge keranjang selalu ter-update otomatis saat kembali ke halaman ini
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const data = await api.getCatalog(searchQuery, selectedCategory);
          if (active) setItems(data);
          const cart = await api.getCart();
          if (active) setCartCount(cart.reduce((sum, it) => sum + it.qty, 0));
        } catch (err) {
          console.warn('Failed to load catalog:', err);
        } finally {
          if (active) {
            setIsLoading(false);
            setRefreshing(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [searchQuery, selectedCategory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.getCatalog(searchQuery, selectedCategory);
      setItems(data);
      const cart = await api.getCart();
      setCartCount(cart.reduce((sum, it) => sum + it.qty, 0));
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddToCart = async (item: Item) => {
    if (item.stok <= 0) return;
    const { cart, remainingStock } = await api.addToCart(item, 1);
    setCartCount(cart.reduce((sum, it) => sum + it.qty, 0));
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, stok: remainingStock } : it))
    );
  };

  const renderItem = ({ item }: { item: Item }) => {
    const formattedPrice = `Rp ${Number(item.harga).toLocaleString('id-ID')}`;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } } as any)}
      >
        {/* Foto Barang */}
        <View style={styles.imageWrapper}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="cube-outline" size={32} color={JasTipColors.textMuted} />
            </View>
          )}
        </View>

        {/* Info Barang */}
        <View style={styles.cardBody}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.nama_barang}
          </Text>
          <Text style={styles.tripName} numberOfLines={1}>
            {item.nama_trip || 'Open Trip'}
          </Text>

          {/* Category Chips */}
          <View style={styles.categoryBadgeRow}>
            {item.category_list && item.category_list.length > 0 ? (
              item.category_list.slice(0, 2).map((cat, idx) => (
                <View key={idx} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{cat}</Text>
                </View>
              ))
            ) : (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>Umum</Text>
              </View>
            )}
          </View>

          {/* Harga & Sisa Stok Row */}
          <Text style={styles.priceText}>{formattedPrice}</Text>

          <View style={styles.footerRow}>
            <Text style={styles.stockText}>Sisa {item.stok}</Text>
            <TouchableOpacity
              style={styles.addCartBtn}
              onPress={() => handleAddToCart(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={16} color="#5C4505" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title="Jelajah Titipan"
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {role === 'Penitip' && (
              <TouchableOpacity
                onPress={() => router.push('/request' as any)}
                style={styles.headerIconBtn}
              >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/cart' as any)}
              style={styles.headerIconBtn}
            >
              <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={JasTipColors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang atau trip"
            placeholderTextColor={JasTipColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={JasTipColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Multi-Kategori Chips */}
      <View style={styles.categoryListWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryContent}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryFilterBtn, isActive && styles.categoryFilterBtnActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[styles.categoryFilterText, isActive && styles.categoryFilterTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Grid Katalog Tile */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={JasTipColors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={JasTipColors.textMuted} />
              <Text style={styles.emptyTitle}>Belum ada barang di trip aktif</Text>
              <Text style={styles.emptySubtitle}>
                Coba ubah kata kunci pencarian atau kategori filter di atas.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Nav Bar */}
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JasTipColors.background,
  },
  headerIconBtn: {
    position: 'relative',
    padding: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: JasTipColors.accent,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5C4505',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -10,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: JasTipColors.text,
  },
  categoryListWrapper: {
    marginBottom: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E6EE',
  },
  categoryFilterBtnActive: {
    backgroundColor: JasTipColors.primary,
    borderColor: JasTipColors.primary,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2ECF2',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: '#EDF4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  tripName: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  categoryChip: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#5C4505',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stockText: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
  },
  addCartBtn: {
    backgroundColor: JasTipColors.accent,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: JasTipColors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
