import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="live-trip" />
      <Stack.Screen name="dashboard-jastiper" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="saldo" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
