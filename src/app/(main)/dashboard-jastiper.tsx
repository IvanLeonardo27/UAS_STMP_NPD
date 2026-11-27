import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { BottomNavBar } from '@/components/common/BottomNavBar';
import { CustomRequest, OrderSummaryItem, Trip } from '@/types/jastip';
import { api } from '@/services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardJastiperScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'requests' | 'summary'>('requests');
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('Semua');
  const [summaryData, setSummaryData] = useState<{
    total_barang: number;
    summary_list: OrderSummaryItem[];
    available_trips?: string[];
  }>({ total_barang: 0, summary_list: [], available_trips: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ACC Dialog state
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [approvedStock, setApprovedStock] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async (filter?: string) => {
    try {
      const tripFilter = filter !== undefined ? filter : selectedTripFilter;
      const [reqList, summary, trips] = await Promise.all([
        api.getRequests(),
        api.getSummary(tripFilter),
        api.getTrips(),
      ]);
      setRequests(reqList);
      setSummaryData(summary);
      setActiveTrip(trips[0] || null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedTripFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTabChange = (tab: 'requests' | 'summary') => {
    setActiveTab(tab);
    if (tab === 'summary') {
      loadData();
    }
  };

  const handleFilterTrip = (tripName: string) => {
    setSelectedTripFilter(tripName);
    loadData(tripName);
  };

  const handleUpdateItemStatus = async (namaBarang: string, nextStatus: 'Dibeli' | 'Dikirim' | 'Tiba') => {
    const label = nextStatus === 'Dibeli' ? 'Dibeli' : nextStatus;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Perbarui Status Pesanan:\n\nApakah barang "${namaBarang}" sudah ${label}?\n\nStatus di aplikasi pembeli (Pesanan Saya) akan otomatis maju ke tahap ${label}.`
      );
      if (confirmed) {
        await api.updateItemStatus(namaBarang, nextStatus);
        await loadData();
        window.alert(`Sukses!\n\nStatus "${namaBarang}" berhasil diperbarui menjadi ${label}.`);
      }
      return;
    }

    Alert.alert(
      'Perbarui Status Pesanan',
      `Apakah barang "${namaBarang}" sudah ${label}?\n\nStatus di aplikasi pembeli (Pesanan Saya) akan otomatis maju ke tahap ${label}.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: `Ya, Tandai ${label}`,
          onPress: async () => {
            await api.updateItemStatus(namaBarang, nextStatus);
            await loadData();
            Alert.alert('Sukses', `Status "${namaBarang}" berhasil diperbarui menjadi ${label}.`);
          },
        },
      ]
    );
  };

  const handleOpenAccDialog = (req: CustomRequest) => {
    setSelectedRequest(req);
    setApprovedStock(10);
  };

  const handleConfirmAcc = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await api.accRequest(selectedRequest.id, approvedStock, selectedRequest.perkiraan_harga);
      setSelectedRequest(null);
      await loadData();
      Alert.alert(
        'Request Disetujui!',
        `Barang "${selectedRequest.nama_barang}" dengan stok ${approvedStock} telah otomatis ditambahkan ke katalog trip!`
      );
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal menyetujui request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reqId: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tolak Request:\n\nApakah Anda yakin ingin menolak request titipan ini?');
      if (confirmed) {
        await api.rejectRequest(reqId);
        await loadData();
      }
      return;
    }

    Alert.alert('Tolak Request', 'Apakah Anda yakin ingin menolak request titipan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak',
        style: 'destructive',
        onPress: async () => {
          await api.rejectRequest(reqId);
          await loadData();
        },
      },
    ]);
  };

  const pendingRequests = requests.filter((r) => r.status === 'Menunggu');

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={JasTipColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar title="Dashboard Jastiper" />

      {/* Segmented Tabs */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}
          onPress={() => handleTabChange('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Request masuk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'summary' && styles.tabButtonActive]}
          onPress={() => handleTabChange('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner Perjalanan Aktif Jastiper */}
        {activeTrip && (
          <View style={styles.tripBannerCard}>
            <View style={styles.tripBannerHeader}>
              <View style={styles.tripPlaneBadge}>
                <Ionicons name="airplane" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.tripBannerSubtitle}>Perjalanan Aktif</Text>
                <Text style={styles.tripBannerTitle}>{activeTrip.nama_trip}</Text>
              </View>
              <View style={styles.tripStatusBadge}>
                <Text style={styles.tripStatusText}>{activeTrip.status || 'Aktif'}</Text>
              </View>
            </View>

            <View style={styles.tripDetailsRow}>
              <View style={styles.tripDetailItem}>
                <Ionicons name="location-outline" size={14} color={JasTipColors.primary} />
                <Text style={styles.tripDetailText}>{activeTrip.lokasi_tujuan}</Text>
              </View>
              <View style={styles.tripDetailItem}>
                <Ionicons name="calendar-outline" size={14} color={JasTipColors.primary} />
                <Text style={styles.tripDetailText}>
                  {activeTrip.tgl_berangkat} - {activeTrip.tgl_kembali}
                </Text>
              </View>
            </View>

            <View style={styles.tripCardButtonsRow}>
              <TouchableOpacity
                style={styles.tripCardEditBtn}
                onPress={() =>
                  router.push({
                    pathname: '/edit-trip',
                    params: { tripId: String(activeTrip.id) },
                  } as any)
                }
              >
                <Ionicons name="create-outline" size={15} color={JasTipColors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.tripCardEditBtnText}>Edit Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tripCardNewBtn}
                onPress={() => router.push('/open-trip' as any)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.tripCardNewBtnText}>Buka Trip Baru</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'requests' ? (
          // TAB 1: REQUEST MASUK
          <View>
            {pendingRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="chatbubbles-outline" size={48} color={JasTipColors.textMuted} />
                <Text style={styles.emptyTitle}>Belum ada request baru</Text>
                <Text style={styles.emptyDesc}>
                  Permintaan titipan barang dari penitip akan muncul di sini.
                </Text>
              </View>
            ) : (
              pendingRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.reqHeaderRow}>
                    <View style={styles.reqIconBox}>
                      <Ionicons name="gift-outline" size={20} color={JasTipColors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reqTitle}>{req.nama_barang}</Text>
                      <Text style={styles.reqSub}>
                        Diminta {req.pemohon_nama || 'Penitip'} · est. Rp{' '}
                        {Number(req.perkiraan_harga).toLocaleString('id-ID')}
                      </Text>
                      {req.catatan ? (
                        <Text style={styles.reqNote}>Catatan: {req.catatan}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.reqActionRow}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(req.id)}
                    >
                      <Text style={styles.rejectBtnText}>Tolak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.accBtn}
                      onPress={() => handleOpenAccDialog(req)}
                    >
                      <Text style={styles.accBtnText}>ACC</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Bottom Trip Action Buttons */}
            <View style={styles.tripActionsArea}>
              <TouchableOpacity
                style={styles.openTripBtn}
                onPress={() => router.push('/open-trip' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="airplane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.openTripBtnText}>Buka trip baru</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editTripBtn}
                onPress={() =>
                  router.push({
                    pathname: '/edit-trip',
                    params: activeTrip ? { tripId: String(activeTrip.id) } : undefined,
                  } as any)
                }
                activeOpacity={0.8}
              >
                <Text style={styles.editTripBtnText}>Edit trip dan barang</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // TAB 2: SUMMARY PESANAN
          <View>
            {/* Trip Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterChipScroll}
              contentContainerStyle={styles.filterChipContainer}
            >
              <TouchableOpacity
                style={[styles.filterChip, selectedTripFilter === 'Semua' && styles.filterChipActive]}
                onPress={() => handleFilterTrip('Semua')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedTripFilter === 'Semua' && styles.filterChipTextActive,
                  ]}
                >
                  Semua Trip
                </Text>
              </TouchableOpacity>
              {activeTrip && (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedTripFilter === activeTrip.nama_trip && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterTrip(activeTrip.nama_trip)}
                >
                  <Ionicons
                    name="airplane"
                    size={12}
                    color={selectedTripFilter === activeTrip.nama_trip ? '#FFFFFF' : JasTipColors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedTripFilter === activeTrip.nama_trip && styles.filterChipTextActive,
                    ]}
                  >
                    {activeTrip.nama_trip}
                  </Text>
                </TouchableOpacity>
              )}
              {summaryData.available_trips
                ?.filter((t) => t !== activeTrip?.nama_trip)
                .map((tripName, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.filterChip,
                      selectedTripFilter === tripName && styles.filterChipActive,
                    ]}
                    onPress={() => handleFilterTrip(tripName)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedTripFilter === tripName && styles.filterChipTextActive,
                      ]}
                    >
                      {tripName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Yellow notice summary */}
            <View style={styles.summaryBanner}>
              <Ionicons name="bag-check-outline" size={20} color="#7A6014" style={{ marginRight: 8 }} />
              <Text style={styles.summaryBannerText}>
                {summaryData.total_barang} barang dipesan oleh para pembeli
                {selectedTripFilter !== 'Semua' ? ` (${selectedTripFilter})` : ''}
              </Text>
            </View>

            {summaryData.summary_list.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="cube-outline" size={48} color={JasTipColors.textMuted} />
                <Text style={styles.emptyTitle}>Belum ada barang belanjaan</Text>
                <Text style={styles.emptyDesc}>
                  Pesanan aktif atau belanjaan baru akan terangkum di sini.
                </Text>
              </View>
            ) : (
              summaryData.summary_list.map((item, idx) => (
                <View key={idx} style={styles.summaryCard}>
                  <View style={styles.summaryIconBox}>
                    <Ionicons name="cube-outline" size={22} color={JasTipColors.primary} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.summaryItemName}>{item.nama_barang}</Text>
                    <Text style={styles.summaryBuyers}>{item.pemesan}</Text>
                    <View style={styles.summaryMetaRow}>
                      {item.nama_trip && (
                        <View style={styles.summaryTripBadge}>
                          <Ionicons
                            name="airplane-outline"
                            size={11}
                            color={JasTipColors.primary}
                            style={{ marginRight: 3 }}
                          />
                          <Text style={styles.summaryTripBadgeText}>{item.nama_trip}</Text>
                        </View>
                      )}
                      {item.status && (
                        <View
                          style={[
                            styles.summaryStatusBadge,
                            item.status === 'Perlu Dibeli'
                              ? styles.statusBadgeOrange
                              : styles.statusBadgeGreen,
                          ]}
                        >
                          <Text
                            style={[
                              styles.summaryStatusText,
                              item.status === 'Perlu Dibeli'
                                ? styles.statusTextOrange
                                : styles.statusTextGreen,
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.summaryRightCol}>
                    <Text style={styles.summaryQtyBadge}>{item.total_qty}x</Text>
                    {item.status === 'Perlu Dibeli' && (
                      <TouchableOpacity
                        style={styles.markPurchasedBtn}
                        onPress={() => handleUpdateItemStatus(item.nama_barang, 'Dibeli')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="bag-check" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.markPurchasedBtnText}>Tandai Dibeli</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'Dibeli' && (
                      <TouchableOpacity
                        style={styles.markArrivedBtn}
                        onPress={() => handleUpdateItemStatus(item.nama_barang, 'Tiba')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="paper-plane" size={12} color="#137333" style={{ marginRight: 4 }} />
                        <Text style={styles.markArrivedBtnText}>Tandai Tiba</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* DIALOG POPUP STOK SAAT ACC (Rubrik C) */}
      <Modal
        visible={!!selectedRequest}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRequest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogIconBox}>
              <Ionicons name="cube" size={28} color={JasTipColors.primary} />
            </View>

            <Text style={styles.dialogTitle}>Setujui request?</Text>
            <Text style={styles.dialogSubtitle}>
              {selectedRequest?.nama_barang} · diminta {selectedRequest?.pemohon_nama || 'Penitip'}
            </Text>
            <Text style={styles.dialogDesc}>
              Tentukan stok agar tayang otomatis di katalog trip
            </Text>

            {/* Counter Control */}
            <View style={styles.dialogCounterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setApprovedStock(Math.max(1, approvedStock - 1))}
              >
                <Text style={styles.counterBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.counterNumber}>{approvedStock}</Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setApprovedStock(approvedStock + 1)}
              >
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Dialog Actions */}
            <View style={styles.dialogActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setSelectedRequest(null)}
              >
                <Text style={styles.dialogCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={handleConfirmAcc}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#5C4505" />
                ) : (
                  <Text style={styles.dialogConfirmText}>ACC & tayangkan</Text>
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
  tripBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8E8F2',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tripBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripPlaneBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: JasTipColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripBannerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: JasTipColors.textMuted,
    textTransform: 'uppercase',
  },
  tripBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: JasTipColors.text,
    marginTop: 1,
  },
  tripStatusBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tripStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#137333',
  },
  tripDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F8',
    marginBottom: 12,
  },
  tripDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  tripCardButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tripCardEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7DCE8',
    backgroundColor: '#F5FAFD',
  },
  tripCardEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.primary,
  },
  tripCardNewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    backgroundColor: JasTipColors.primary,
  },
  tripCardNewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EDF3F7',
    marginHorizontal: 16,
    marginTop: -10,
    marginBottom: 12,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: JasTipColors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2ECF2',
  },
  reqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reqIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EDF4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  reqSub: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  reqNote: {
    fontSize: 11,
    color: JasTipColors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  reqActionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    backgroundColor: '#FFFFFF',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  accBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: JasTipColors.accent,
  },
  accBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4505',
  },
  tripActionsArea: {
    marginTop: 16,
    gap: 10,
  },
  openTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: JasTipColors.primary,
    height: 48,
    borderRadius: 14,
  },
  openTripBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  editTripBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: JasTipColors.primary,
    backgroundColor: '#FFFFFF',
  },
  editTripBtnText: {
    color: JasTipColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF8E7',
    borderWidth: 1,
    borderColor: '#F5E2A8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  summaryBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A6014',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2ECF2',
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  summaryBuyers: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  summaryQtyBadge: {
    fontSize: 16,
    fontWeight: '800',
    color: JasTipColors.primary,
    paddingHorizontal: 8,
  },
  filterChipScroll: {
    marginBottom: 12,
  },
  filterChipContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8E8F2',
  },
  filterChipActive: {
    backgroundColor: JasTipColors.primary,
    borderColor: JasTipColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF4F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryTripBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: JasTipColors.primary,
  },
  summaryStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeOrange: {
    backgroundColor: '#FFF4E5',
  },
  statusBadgeGreen: {
    backgroundColor: '#E6F4EA',
  },
  summaryStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextOrange: {
    color: '#B06000',
  },
  statusTextGreen: {
    color: '#137333',
  },
  summaryRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  markPurchasedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JasTipColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markPurchasedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  markArrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#CEEAD6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  markArrivedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#137333',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: JasTipColors.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  dialogIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: JasTipColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: JasTipColors.text,
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
    marginBottom: 4,
  },
  dialogDesc: {
    fontSize: 12,
    color: JasTipColors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF3F7',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 24,
  },
  counterBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  counterNumber: {
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  dialogConfirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: JasTipColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4505',
  },
});
