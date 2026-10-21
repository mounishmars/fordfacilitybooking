import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { colors } from '@/lib/theme';

type Facility = {
  id: string;
  name: string;
  type: string;
  location: string;
};

type Slot = {
  id: string;
  startAt: string;
  endAt: string;
  available: boolean;
  status: string;
  heldCount: number;
  capacity: number;
};

function dayRange(offset: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString(), label: start };
}

export default function FacilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const range = useMemo(() => dayRange(dayOffset), [dayOffset]);

  const load = useCallback(async () => {
    if (!id) return;
    setError('');
    setLoading(true);
    try {
      const [f, availability] = await Promise.all([
        api<Facility>(`/facilities/${id}`),
        api<Slot[]>(
          `/facilities/${id}/availability?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
        ),
      ]);
      setFacility(f);
      setSlots(availability);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, range.from, range.to]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function requestSlot(slot: Slot) {
    if (!id) return;
    setSubmitting(slot.id);
    setMessage('');
    setError('');
    try {
      await api('/bookings', {
        method: 'POST',
        body: JSON.stringify({ facilityId: id, slotId: slot.id }),
      });
      setMessage('Request submitted — waiting for admin approval.');
      await load();
      setTimeout(() => router.push('/bookings'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <View style={styles.container}>
      {facility ? (
        <View style={styles.header}>
          <Text style={styles.type}>{facility.type}</Text>
          <Text style={styles.name}>{facility.name}</Text>
          <Text style={styles.muted}>{facility.location}</Text>
        </View>
      ) : null}

      <View style={styles.dayRow}>
        <Pressable
          style={styles.dayBtn}
          onPress={() => setDayOffset((d) => Math.max(0, d - 1))}
          disabled={dayOffset === 0}
        >
          <Text style={styles.dayBtnText}>Prev</Text>
        </Pressable>
        <Text style={styles.dayLabel}>
          {range.label.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Pressable
          style={styles.dayBtn}
          onPress={() => setDayOffset((d) => Math.min(6, d + 1))}
          disabled={dayOffset >= 6}
        >
          <Text style={styles.dayBtnText}>Next</Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.muted}>No slots for this day. Run API seed.</Text>
          }
          renderItem={({ item }) => {
            const label = `${new Date(item.startAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })} – ${new Date(item.endAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`;
            const disabled = !item.available || submitting === item.id;
            return (
              <View style={styles.slot}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotTime}>{label}</Text>
                  <Text style={styles.muted}>
                    {item.status === 'BLOCKED'
                      ? 'Blocked'
                      : item.available
                        ? 'Available'
                        : `Full (${item.heldCount}/${item.capacity})`}
                  </Text>
                </View>
                <Pressable
                  style={[styles.bookBtn, disabled && styles.bookBtnDisabled]}
                  disabled={disabled}
                  onPress={() => requestSlot(item)}
                >
                  {submitting === item.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.bookBtnText}>Request</Text>
                  )}
                </Pressable>
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
  header: { marginBottom: 12 },
  type: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, marginTop: 2 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBtnText: { fontWeight: '700', color: colors.accentDark },
  dayLabel: { fontWeight: '800', color: colors.text },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  slotTime: { fontWeight: '700', color: colors.text, fontSize: 16 },
  bookBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
  },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { color: '#fff', fontWeight: '700' },
  success: { color: colors.confirmed, marginBottom: 8, fontWeight: '600' },
  error: { color: colors.rejected, marginBottom: 8 },
});
