import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { BookingStatus } from '@ford/shared';
import { api } from '@/lib/api';
import { colors } from '@/lib/theme';

type Booking = {
  id: string;
  status: BookingStatus;
  adminNote?: string | null;
  facility?: { name: string; type: string };
  slot?: { startAt: string; endAt: string };
};

const statusColor: Record<string, string> = {
  PENDING: colors.pending,
  CONFIRMED: colors.confirmed,
  REJECTED: colors.rejected,
  CANCELLED: colors.cancelled,
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/facilities');
    }
  }

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api<Booking[]>('/bookings/me');
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function cancel(id: string) {
    setBusyId(id);
    try {
      await api(`/bookings/${id}/cancel`, { method: 'POST', body: '{}' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My bookings',
          headerLeft: () => (
            <Pressable onPress={goBack} style={styles.headerBack} hitSlop={8}>
              <Text style={styles.headerBackText}>← Back</Text>
            </Pressable>
          ),
        }}
      />

      <Pressable style={styles.backBar} onPress={goBack}>
        <Text style={styles.backBarText}>← Back to facilities</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={load} />
          }
          ListHeaderComponent={
            error ? <Text style={styles.error}>{error}</Text> : null
          }
          ListEmptyComponent={
            <Text style={styles.muted}>No bookings yet.</Text>
          }
          renderItem={({ item }) => {
            const canCancel =
              item.status === BookingStatus.PENDING ||
              item.status === BookingStatus.CONFIRMED;
            return (
              <View style={styles.card}>
                <Text
                  style={[
                    styles.status,
                    { color: statusColor[item.status] || colors.muted },
                  ]}
                >
                  {item.status}
                </Text>
                <Text style={styles.name}>{item.facility?.name}</Text>
                <Text style={styles.muted}>{item.facility?.type}</Text>
                <Text style={styles.time}>
                  {item.slot
                    ? `${new Date(item.slot.startAt).toLocaleString()} – ${new Date(
                        item.slot.endAt,
                      ).toLocaleTimeString()}`
                    : '—'}
                </Text>
                {item.adminNote ? (
                  <Text style={styles.note}>Note: {item.adminNote}</Text>
                ) : null}
                {canCancel ? (
                  <Pressable
                    style={styles.cancelBtn}
                    disabled={busyId === item.id}
                    onPress={() => cancel(item.id)}
                  >
                    <Text style={styles.cancelText}>
                      {busyId === item.id ? 'Cancelling…' : 'Cancel booking'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerBack: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginRight: 8,
  },
  headerBackText: {
    color: colors.accentDark,
    fontWeight: '700',
    fontSize: 16,
  },
  backBar: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  backBarText: {
    color: colors.accentDark,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  status: { fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  muted: { color: colors.muted, marginTop: 2 },
  time: { marginTop: 8, color: colors.text, fontWeight: '600' },
  note: { marginTop: 8, color: colors.muted, fontStyle: 'italic' },
  cancelBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rejected,
  },
  cancelText: { color: colors.rejected, fontWeight: '700' },
  error: { color: colors.rejected, marginBottom: 8 },
});
