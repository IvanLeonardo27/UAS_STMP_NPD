import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { JasTipColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function HeaderBar({ title, subtitle, showBack = false, rightAction }: HeaderBarProps) {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" backgroundColor={JasTipColors.primary} />
      <View style={styles.contentRow}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        <View style={styles.titleArea}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        <View style={styles.rightArea}>{rightAction ? rightAction : <View style={{ width: 24 }} />}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: JasTipColors.primary,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 12,
    color: '#D4E6F0',
    marginTop: 2,
  },
  rightArea: {
    alignItems: 'flex-end',
  },
});
