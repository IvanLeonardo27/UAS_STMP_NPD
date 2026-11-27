import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { BottomNavBar } from '@/components/common/BottomNavBar';
import { Order } from '@/types/jastip';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

const ORDER_STEPS = ['Dipesan', 'Dibeli', 'Dikirim', 'Tiba'];

export default function OrdersScreen() {
  const { refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  // Review Modal State (Fitur Tambahan 3: Rating & Review Jastiper)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderIdForReview, setSelectedOrderIdForReview] = useState<number | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!selectedOrderIdForReview) return;
    setIsSubmittingReview(true);
    try {
      await api.submitReview(selectedOrderIdForReview, ratingStars, reviewComment.trim());
      await loadOrders();
      setReviewModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert('Terima kasih! Ulasan kamu berhasil dikirim.');
      } else {
        Alert.alert('Sukses', 'Terima kasih! Ulasan kamu berhasil dikirim.');
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert(e.message || 'Gagal mengirim ulasan.');
      } else {
        Alert.alert('Gagal', e.message || 'Gagal mengirim ulasan.');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleConfirmReceived = async (orderId: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Konfirmasi Terima Barang:\n\nApakah barang titipan sudah kamu terima dengan baik? Saldo yang ditahan akan langsung diteruskan ke Jastiper.'
      );
      if (confirmed) {
        setProcessingOrderId(orderId);
        try {
          await api.confirmOrderReceived(orderId);
          await refreshUser();
          await loadOrders();
          window.alert('Transaksi Selesai!\n\nTerima kasih! Saldo telah diteruskan ke Jastiper. Transaksi ini sekarang masuk ke Riwayat.');
        } catch (e: any) {
          window.alert(e.message || 'Gagal menyelesaikan pesanan.');
        } finally {
          setProcessingOrderId(null);
        }
      }
      return;
    }

    Alert.alert(
      'Konfirmasi Terima Barang',
      'Apakah barang titipan sudah kamu terima dengan baik? Saldo yang ditahan akan langsung diteruskan ke Jastiper.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Terima & Selesaikan',
          onPress: async () => {
            setProcessingOrderId(orderId);
            try {
              await api.confirmOrderReceived(orderId);
              await refreshUser();
              await loadOrders();
              Alert.alert(
                'Transaksi Selesai!',
                'Terima kasih! Saldo telah diteruskan ke Jastiper. Transaksi ini sekarang masuk ke Riwayat.'
              );
            } catch (e: any) {
              Alert.alert('Gagal', e.message || 'Gagal menyelesaikan pesanan.');
            } finally {
              setProcessingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = async (order: Order) => {
    const formatted = `Rp ${Number(order.total_harga).toLocaleString('id-ID')}`;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Batalkan Pesanan:\n\nApakah kamu ingin membatalkan pesanan ${order.order_code}?\n\nSaldo sebesar ${formatted} akan langsung dikembalikan ke akunmu, dan barang akan dikeluarkan dari daftar belanja Jastiper.`
      );
      if (confirmed) {
        setProcessingOrderId(order.id);
        try {
          await api.cancelOrder(order.id);
          await refreshUser();
          await loadOrders();
          window.alert(`Pesanan Dibatalkan!\n\nSaldo sebesar ${formatted} telah dikembalikan.`);
        } catch (e: any) {
          window.alert(e.message || 'Gagal membatalkan pesanan.');
        } finally {
          setProcessingOrderId(null);
        }
      }
      return;
    }

    Alert.alert(
      'Batalkan Pesanan',
      `Apakah kamu ingin membatalkan pesanan ${order.order_code}?\n\nSaldo sebesar ${formatted} akan dikembalikan ke akunmu.`,
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: async () => {
            setProcessingOrderId(order.id);
            try {
              await api.cancelOrder(order.id);
              await refreshUser();
              await loadOrders();
              Alert.alert('Sukses', `Pesanan telah dibatalkan dan saldo ${formatted} telah dikembalikan.`);
            } catch (e: any) {
              Alert.alert('Gagal', e.message || 'Gagal membatalkan pesanan.');
            } finally {
              setProcessingOrderId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={JasTipColors.primary} />
      </View>
    );
  }

  const ongoingOrders = orders.filter((o) => o.status !== 'Selesai');
  const historyOrders = orders.filter((o) => o.status === 'Selesai');
  const displayOrders = activeTab === 'ongoing' ? ongoingOrders : historyOrders;

  const getStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'Dipesan':
        return 0;
      case 'Dibeli':
        return 1;
      case 'Dikirim':
        return 2;
      case 'Tiba':
      case 'Selesai':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar title="Pesanan Saya" />

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ongoing' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ongoing')}
        >
          <Text style={[styles.tabText, activeTab === 'ongoing' && styles.tabTextActive]}>
            Sedang berjalan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Riwayat
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color={JasTipColors.textMuted} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'ongoing'
                ? 'Tidak ada pesanan yang sedang berjalan'
                : 'Belum ada riwayat pesanan selesai'}
            </Text>
            <Text style={styles.emptySub}>
              Pesanan titipan yang kamu checkout akan tampil di sini.
            </Text>
          </View>
        ) : (
          displayOrders.map((ord) => {
            const currentStep = getStepIndex(ord.status);
            const itemsSummary =
              ord.details && ord.details.length > 0
                ? ord.details.map((d) => `${d.nama_barang} x${d.qty}`).join(', ')
                : 'Barang Titipan';

            return (
              <View key={ord.id} style={styles.orderCard}>
                {/* Header Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.orderCode}>{ord.order_code}</Text>
                    {ord.order_code.startsWith('REQ-') && (
                      <View style={styles.requestBadge}>
                        <Text style={styles.requestBadgeText}>Request Titipan</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{ord.status}</Text>
                  </View>
                </View>

                {/* Trip & Jastiper */}
                <Text style={styles.tripInfoText}>
                  {ord.nama_trip || 'Bangkok Snack & Beauty Hunt'} · {ord.jastiper_nama || 'Kevin Jastiper'}
                </Text>
                <Text style={styles.itemsSummaryText}>{itemsSummary}</Text>

                {/* 4-Step Status Progress Tracker */}
                <View style={styles.stepperContainer}>
                  {ORDER_STEPS.map((step, idx) => {
                    const isPassed = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <View key={step} style={styles.stepCol}>
                        <View
                          style={[
                            styles.stepDot,
                            isPassed && styles.stepDotPassed,
                            isCurrent && styles.stepDotCurrent,
                          ]}
                        />
                        <Text style={[styles.stepLabel, isPassed && styles.stepLabelPassed]}>
                          {step}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Total Price */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    Rp {Number(ord.total_harga).toLocaleString('id-ID')}
                  </Text>
                </View>

                {/* Escrow Notice */}
                {ord.status !== 'Selesai' && (
                  <View style={styles.escrowNotice}>
                    <Ionicons name="lock-closed-outline" size={14} color="#7A6014" style={{ marginRight: 6 }} />
                    <Text style={styles.escrowText}>
                      Saldo ditahan sampai kamu konfirmasi barang diterima.
                    </Text>
                  </View>
                )}

                {/* Cancel Order Button (Only when status is Dipesan) */}
                {ord.status === 'Dipesan' && (
                  <TouchableOpacity
                    style={styles.cancelOrderBtn}
                    onPress={() => handleCancelOrder(ord)}
                    disabled={processingOrderId === ord.id}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#D9383A" style={{ marginRight: 6 }} />
                    <Text style={styles.cancelOrderBtnText}>Batalkan Pesanan</Text>
                  </TouchableOpacity>
                )}

                {/* Confirm Received Button (Only when status is Tiba) */}
                {ord.status === 'Tiba' && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => handleConfirmReceived(ord.id)}
                    disabled={processingOrderId === ord.id}
                    activeOpacity={0.8}
                  >
                    {processingOrderId === ord.id ? (
                      <ActivityIndicator color="#5C4505" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={18} color="#5C4505" style={{ marginRight: 6 }} />
                        <Text style={styles.confirmBtnText}>Konfirmasi terima barang</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Fitur Tambahan 3: Sistem Ulasan / Rating Jastiper untuk Pesanan Selesai */}
                {ord.status === 'Selesai' && (
                  <View style={styles.reviewSection}>
                    {ord.rating ? (
                      <View style={styles.reviewResultBox}>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= (ord.rating || 5) ? 'star' : 'star-outline'}
                              size={16}
                              color="#F59E0B"
                              style={{ marginRight: 2 }}
                            />
                          ))}
                          <Text style={styles.ratingScoreText}>{ord.rating}.0 / 5.0</Text>
                        </View>
                        {ord.review_comment ? (
                          <Text style={styles.reviewCommentText}>&ldquo;{ord.review_comment}&rdquo;</Text>
                        ) : null}
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.giveReviewBtn}
                        onPress={() => {
                          setSelectedOrderIdForReview(ord.id);
                          setRatingStars(5);
                          setReviewComment('Barang sampai dalam kondisi baik dan aman!');
                          setReviewModalVisible(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="star-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
                        <Text style={styles.giveReviewBtnText}>Beri Ulasan Jastiper</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL BERI ULASAN (Fitur Tambahan 3) */}
      <Modal visible={reviewModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Beri Ulasan Jastiper</Text>
            <Text style={styles.ratingPrompt}>Berapa bintang untuk pelayanan jastip ini?</Text>

            {/* Interactive Stars Row */}
            <View style={styles.interactiveStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingStars(star)}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={star <= ratingStars ? 'star' : 'star-outline'}
                    size={32}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Komentar / Pengalaman Titip</Text>
            <TextInput
              style={styles.reviewInput}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Ceritakan pengalaman jastip kamu..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Kirim Ulasan</Text>
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2ECF2',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  requestBadge: {
    backgroundColor: '#E8F4F8',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  requestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B5E80',
  },
  statusBadge: {
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4505',
  },
  tripInfoText: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    marginBottom: 2,
  },
  itemsSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.text,
    marginBottom: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  stepCol: {
    alignItems: 'center',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D1E1EC',
    marginBottom: 4,
  },
  stepDotPassed: {
    backgroundColor: JasTipColors.primary,
  },
  stepDotCurrent: {
    backgroundColor: JasTipColors.accent,
    borderWidth: 2,
    borderColor: JasTipColors.accentDark,
  },
  stepLabel: {
    fontSize: 10,
    color: JasTipColors.textMuted,
  },
  stepLabelPassed: {
    color: JasTipColors.primary,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 13,
    color: JasTipColors.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF8E7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  escrowText: {
    flex: 1,
    fontSize: 11,
    color: '#7A6014',
    lineHeight: 15,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: JasTipColors.accent,
    height: 44,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C4505',
  },
  cancelOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F8D7DA',
    backgroundColor: '#FFF5F5',
  },
  cancelOrderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D9383A',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: JasTipColors.text,
    marginTop: 14,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  reviewSection: {
    marginTop: 6,
  },
  reviewResultBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 6,
  },
  reviewCommentText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
    marginTop: 4,
  },
  giveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    height: 40,
    borderRadius: 10,
  },
  giveReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: JasTipColors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  ratingPrompt: {
    fontSize: 12,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
    marginBottom: 6,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#D8E5ED',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: JasTipColors.text,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: JasTipColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
