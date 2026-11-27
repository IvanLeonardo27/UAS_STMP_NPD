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
  RefreshControl,
} from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { HeaderBar } from '@/components/common/HeaderBar';
import { BottomNavBar } from '@/components/common/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { WalletTransaction } from '@/types/jastip';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const QUICK_AMOUNTS = [50000, 100000, 250000, 500000];

export default function SaldoScreen() {
  const { user, role, updateSaldo, refreshUser } = useAuth();
  const [topupAmount, setTopupAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'in' | 'out'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const formattedSaldo = user ? `Rp ${Number(user.saldo).toLocaleString('id-ID')}` : 'Rp 0';

  const loadTransactions = useCallback(async () => {
    try {
      if (user) {
        const list = await api.getTransactions(user.id);
        setTransactions(list);
      }
    } catch (e) {
      console.warn('Failed to load transactions:', e);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      loadTransactions();
    }, [refreshUser, loadTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadTransactions();
  };

  const handleTopup = async () => {
    const amount = Number(topupAmount.replace(/[^0-9]/g, ''));
    if (!amount || amount < 10000) {
      Alert.alert('Perhatian', 'Nominal top up minimal Rp 10.000.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSaldo(amount);
      setTopupAmount('');
      await loadTransactions();
      Alert.alert('Berhasil', `Top up sebesar Rp ${amount.toLocaleString('id-ID')} berhasil ditambahkan ke saldo kamu!`);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal melakukan top up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (txFilter === 'in') return t.type === 'in';
    if (txFilter === 'out') return t.type === 'out';
    return true;
  });

  return (
    <View style={styles.container}>
      <HeaderBar title="Saldo" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Main Big Teal Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>Saldo kamu</Text>
          <Text style={styles.cardBalanceText}>{formattedSaldo}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{role}</Text>
          </View>
        </View>

        {/* Topup Section */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Topup saldo</Text>

          <TextInput
            style={styles.inputField}
            placeholder="mis. 100000"
            placeholderTextColor={JasTipColors.textMuted}
            value={topupAmount}
            onChangeText={setTopupAmount}
            keyboardType="numeric"
          />

          {/* Quick Choice Chips */}
          <View style={styles.quickChipsRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.chipButton}
                onPress={() => setTopupAmount(String(amt))}
              >
                <Text style={styles.chipText}>+{amt.toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Topup Action Button */}
          <TouchableOpacity
            style={styles.topupButton}
            onPress={handleTopup}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#5C4505" />
            ) : (
              <Text style={styles.topupButtonText}>Topup sekarang</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Riwayat Transaksi Section */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>Riwayat Transaksi</Text>
              <Text style={styles.historySubtitle}>Arus uang masuk & pengeluaran saldo</Text>
            </View>
            <View style={styles.historyIconBadge}>
              <Ionicons name="receipt-outline" size={18} color={JasTipColors.primary} />
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, txFilter === 'all' && styles.filterChipActive]}
              onPress={() => setTxFilter('all')}
            >
              <Text style={[styles.filterChipText, txFilter === 'all' && styles.filterChipTextActive]}>
                Semua
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, txFilter === 'in' && styles.filterChipActive]}
              onPress={() => setTxFilter('in')}
            >
              <Ionicons
                name="arrow-down"
                size={12}
                color={txFilter === 'in' ? '#FFFFFF' : '#137333'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, txFilter === 'in' && styles.filterChipTextActive]}>
                Uang Masuk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, txFilter === 'out' && styles.filterChipActive]}
              onPress={() => setTxFilter('out')}
            >
              <Ionicons
                name="arrow-up"
                size={12}
                color={txFilter === 'out' ? '#FFFFFF' : '#D9383A'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterChipText, txFilter === 'out' && styles.filterChipTextActive]}>
                Pengeluaran
              </Text>
            </TouchableOpacity>
          </View>

          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyTxBox}>
              <Ionicons name="wallet-outline" size={36} color={JasTipColors.textMuted} />
              <Text style={styles.emptyTxTitle}>Belum ada riwayat transaksi</Text>
              <Text style={styles.emptyTxSub}>
                Setiap transaksi top up, pembayaran, atau pencairan saldo akan tercatat di sini.
              </Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'in';
              return (
                <View key={tx.id} style={styles.txItemRow}>
                  {/* Left Icon */}
                  <View
                    style={[
                      styles.txIconBox,
                      isIncome ? styles.txIconBoxIncome : styles.txIconBoxExpense,
                    ]}
                  >
                    <Ionicons
                      name={isIncome ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color={isIncome ? '#137333' : '#D9383A'}
                    />
                  </View>

                  {/* Title & Description */}
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.txTitleText}>{tx.title}</Text>
                    {tx.description ? (
                      <Text style={styles.txDescText} numberOfLines={1}>
                        {tx.description}
                      </Text>
                    ) : null}
                    <Text style={styles.txDateText}>{tx.created_at}</Text>
                  </View>

                  {/* Amount & Badge */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.txAmountText,
                        isIncome ? styles.txAmountIncome : styles.txAmountExpense,
                      ]}
                    >
                      {isIncome ? '+' : '-'}Rp {Number(tx.amount).toLocaleString('id-ID')}
                    </Text>
                    <View
                      style={[
                        styles.txTypeBadge,
                        isIncome ? styles.txBadgeIncome : styles.txBadgeExpense,
                      ]}
                    >
                      <Text
                        style={[
                          styles.txTypeBadgeText,
                          isIncome ? styles.txTextIncome : styles.txTextExpense,
                        ]}
                      >
                        {isIncome ? 'Masuk' : 'Keluar'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Info Escrow Transaksi */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={JasTipColors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Saldo pembayaran ditahan secara aman di sistem JasTipGo dan baru ditransfer ke Jastiper setelah barang pesanan kamu terima.
          </Text>
        </View>
      </ScrollView>

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
    padding: 16,
    paddingBottom: 24,
  },
  balanceCard: {
    backgroundColor: JasTipColors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 13,
    color: '#D4E6F0',
    marginBottom: 6,
  },
  cardBalanceText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: JasTipColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C4505',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
    marginBottom: 12,
  },
  inputField: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D8E5ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: JasTipColors.text,
    backgroundColor: '#FBFDFE',
    marginBottom: 12,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chipButton: {
    backgroundColor: '#EDF4F8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    color: JasTipColors.primary,
    fontWeight: '600',
  },
  topupButton: {
    backgroundColor: JasTipColors.accent,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C4505',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2ECF2',
    marginBottom: 16,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: JasTipColors.text,
  },
  historySubtitle: {
    fontSize: 11,
    color: JasTipColors.textMuted,
    marginTop: 2,
  },
  historyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDF4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F7FA',
    borderWidth: 1,
    borderColor: '#D8E5ED',
  },
  filterChipActive: {
    backgroundColor: JasTipColors.primary,
    borderColor: JasTipColors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: JasTipColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  txItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F8',
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIconBoxIncome: {
    backgroundColor: '#E6F4EA',
  },
  txIconBoxExpense: {
    backgroundColor: '#FCE8E6',
  },
  txTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: JasTipColors.text,
  },
  txDescText: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    marginTop: 2,
  },
  txDateText: {
    fontSize: 10,
    color: JasTipColors.textMuted,
    marginTop: 3,
  },
  txAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  txAmountIncome: {
    color: '#137333',
  },
  txAmountExpense: {
    color: '#D9383A',
  },
  txTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  txBadgeIncome: {
    backgroundColor: '#E6F4EA',
  },
  txBadgeExpense: {
    backgroundColor: '#FCE8E6',
  },
  txTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  txTextIncome: {
    color: '#137333',
  },
  txTextExpense: {
    color: '#D9383A',
  },
  emptyTxBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: JasTipColors.text,
    marginTop: 10,
  },
  emptyTxSub: {
    fontSize: 11,
    color: JasTipColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F2F7',
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: JasTipColors.primaryDark,
    lineHeight: 18,
  },
});
