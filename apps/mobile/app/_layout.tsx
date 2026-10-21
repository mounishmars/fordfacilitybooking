import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.accentDark,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="facilities/index" options={{ title: 'Facilities' }} />
        <Stack.Screen name="facilities/[id]" options={{ title: 'Book slot' }} />
        <Stack.Screen name="bookings/index" options={{ title: 'My bookings' }} />
      </Stack>
    </>
  );
}
