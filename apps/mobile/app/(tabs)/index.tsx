import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api, getUser, clearSession } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [counts, setCounts] = useState({ appts: 0, meds: 0 });

  useEffect(() => {
    getUser<{ firstName: string }>().then((u) => setName(u?.firstName ?? ''));
    (async () => {
      try {
        const [appts, meds] = await Promise.all([
          api.get<any[]>('/me/appointments'),
          api.get<any[]>('/me/medication-orders'),
        ]);
        const upcoming = appts.filter((a) => new Date(a.startAt) >= new Date() && a.status !== 'CANCELLED');
        setCounts({ appts: upcoming.length, meds: meds.length });
      } catch {}
    })();
  }, []);

  async function logout() {
    await clearSession();
    router.replace('/login');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.greeting}>Hola{name ? `, ${name}` : ''} 👋</Text>
      <Text style={styles.sub}>Bienvenido a tu portal de salud.</Text>

      <View style={styles.row}>
        <View style={[styles.stat, { backgroundColor: '#eef2ee' }]}>
          <Text style={styles.statNum}>{counts.appts}</Text>
          <Text style={styles.statLabel}>Citas próximas</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#f0fdf4' }]}>
          <Text style={styles.statNum}>{counts.meds}</Text>
          <Text style={styles.statLabel}>Recetas</Text>
        </View>
      </View>

      <Pressable style={styles.link} onPress={() => router.push('/(tabs)/appointments')}>
        <Text style={styles.linkText}>📅 Ver mis citas</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => router.push('/(tabs)/prescriptions')}>
        <Text style={styles.linkText}>💊 Ver mis recetas</Text>
      </Pressable>
      <Pressable style={styles.link} onPress={() => router.push('/(tabs)/diary')}>
        <Text style={styles.linkText}>📔 Mi diario</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  sub: { fontSize: 16, color: '#64748b', marginTop: 4, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: 'bold', color: '#57665a' },
  statLabel: { fontSize: 14, color: '#475569', marginTop: 4 },
  link: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 18, marginBottom: 12 },
  linkText: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  logout: { marginTop: 20, padding: 14, alignItems: 'center' },
  logoutText: { color: '#64748b', fontSize: 16 },
});
