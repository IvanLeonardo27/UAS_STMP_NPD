import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { JasTipColors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NavigationGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

function NavigationGate() {
  const { isLoggedIn, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = pathname.startsWith('/(auth)') || pathname === '/login';

    if (!isLoggedIn && !inAuthGroup) {
      // Auto-Login: Belum login, arahkan ke layar login
      router.replace('/(auth)/login' as any);
    } else if (isLoggedIn && inAuthGroup) {
      // Auto-Login: Sesi sudah ada di SharedPreferences/AsyncStorage, langsung ke main
      router.replace('/(main)' as any);
    }
  }, [isLoggedIn, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: JasTipColors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={JasTipColors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="open-trip" />
      <Stack.Screen name="edit-trip" />
      <Stack.Screen name="item-form" />
      <Stack.Screen name="request" />
    </Stack>
  );
}
