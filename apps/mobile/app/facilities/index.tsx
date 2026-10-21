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
import { useFocusEffect, useRouter } from 'expo-router';
import { api, clearSession } from '@/lib/api';
import { colors } from '@/lib/theme';

type Facility = {
  id: string;
  name: string;
  type: string;
  location: string;
};

export default function FacilitiesScreen() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api<Facility[]>('/facilities');
      setFacilities(data);
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

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable
          style={styles.linkBtn}
          onPress={() => router.push('/bookings')}
        >
          <Text style={styles.linkText}>My bookings</Text>
        </Pressable>
        <Pressable
          style={styles.linkBtn}
          onPress={async () => {
            await clearSession();
            router.replace('/');
          }}
        >
          <Text style={styles.linkText}>Sign out</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={load} />
          }
          ListHeaderComponent={
            error ? <Text style={styles.error}>{error}</Text> : null
          }
          ListEmptyComponent={
            <Text style={styles.muted}>No facilities available.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/facilities/${item.id}`)}
            >
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.muted}>{item.location}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  linkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkText: { color: colors.accentDark, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  type: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, marginTop: 4 },
  error: { color: colors.rejected, marginBottom: 8 },
});
