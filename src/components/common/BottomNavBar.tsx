import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();

  const isTabActive = (route: string) => {
    if (route === '/(main)' && (pathname === '/(main)' || pathname === '/(main)/' || pathname === '/')) {
      return true;
    }
    return pathname.includes(route);
  };

  return (
    <View style={styles.navContainer}>
      {/* Tab 1: Katalog */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => router.replace('/(main)' as any)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isTabActive('/(main)') && !pathname.includes('live') && !pathname.includes('saldo') && !pathname.includes('profile') && !pathname.includes('orders') && !pathname.includes('dashboard') ? 'grid' : 'grid-outline'}
          size={22}
          color={isTabActive('/(main)') && !pathname.includes('live') && !pathname.includes('saldo') && !pathname.includes('profile') && !pathname.includes('orders') && !pathname.includes('dashboard') ? JasTipColors.primary : JasTipColors.textMuted}
        />
      </TouchableOpacity>

      {/* Tab 2: Live Trip */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => router.replace('/(main)/live-trip' as any)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={pathname.includes('live-trip') ? 'navigate' : 'navigate-outline'}
          size={23}
          color={pathname.includes('live-trip') ? JasTipColors.primary : JasTipColors.textMuted}
        />
      </TouchableOpacity>

      {/* Tab 3: Tengah (Dashboard Jastiper vs Pesanan Saya / Request) */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => {
          if (role === 'Jastiper') {
            router.replace('/(main)/dashboard-jastiper' as any);
          } else {
            router.replace('/(main)/orders' as any);
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={
            role === 'Jastiper'
              ? pathname.includes('dashboard')
                ? 'briefcase'
                : 'briefcase-outline'
              : pathname.includes('orders')
              ? 'receipt'
              : 'receipt-outline'
          }
          size={23}
          color={
            (role === 'Jastiper' && pathname.includes('dashboard')) ||
            (role === 'Penitip' && pathname.includes('orders'))
              ? JasTipColors.primary
              : JasTipColors.textMuted
          }
        />
      </TouchableOpacity>

      {/* Tab 4: Saldo */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => router.replace('/(main)/saldo' as any)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={pathname.includes('saldo') ? 'wallet' : 'wallet-outline'}
          size={23}
          color={pathname.includes('saldo') ? JasTipColors.primary : JasTipColors.textMuted}
        />
      </TouchableOpacity>

      {/* Tab 5: Profil */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => router.replace('/(main)/profile' as any)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={pathname.includes('profile') ? 'person' : 'person-outline'}
          size={23}
          color={pathname.includes('profile') ? JasTipColors.primary : JasTipColors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2ECF2',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
