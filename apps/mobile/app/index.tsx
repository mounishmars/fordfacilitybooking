import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { UserRole } from '@ford/shared';
import { API_URL, getStoredUser, mockLogin } from '@/lib/api';
import { colors } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('employee@ford.com');
  const [name, setName] = useState('Ford Employee');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const user = await getStoredUser();
      if (user) {
        router.replace('/facilities');
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  async function onLogin() {
    setLoading(true);
    setError('');
    try {
      await mockLogin({
        email,
        name,
        role: UserRole.EMPLOYEE,
      });
      router.replace('/facilities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Ford</Text>
        <Text style={styles.title}>Facility Booking</Text>
        <Text style={styles.subtitle}>
          Book turf and badminton courts. Approvals by facility admin.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Mock SSO (Entra later)</Text>
        <Text style={styles.apiHint}>API: {API_URL}</Text>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue as Employee</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  hero: { marginBottom: 28 },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.muted,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  apiHint: {
    color: colors.muted,
    marginBottom: 14,
    fontSize: 11,
  },
  fieldLabel: {
    color: colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.rejected, marginBottom: 8 },
});
