import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '@/lib/api';

interface Appt {
  id: string; startAt: string; status: string; type: string;
  service?: { name: string } | null;
  provider: { firstName: string; lastName: string };
}

const STATUS: Record<string, string> = {
  REQUESTED: 'Solicitada', CONFIRMED: 'Confirmada', RESCHEDULE_REQUESTED: 'Reagenda pedida',
  CANCELLED: 'Cancelada', COMPLETED: 'Realizada', NO_SHOW: 'No asistió',
};

export default function Appointments() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try { setAppts(await api.get<Appt[]>('/me/appointments')); setError(''); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const upcoming = appts.filter((a) => new Date(a.startAt) >= new Date() && a.status !== 'CANCELLED');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.h1}>Mis citas</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && upcoming.length === 0 && <Text style={styles.empty}>No tienes citas próximas.</Text>}
      {upcoming.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {new Date(a.startAt).toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.cardSub}>{a.service?.name ?? 'Consulta'} · con {a.provider.firstName} {a.provider.lastName}</Text>
          <Text style={styles.badge}>{STATUS[a.status] ?? a.status}{a.type === 'TELEHEALTH' ? ' · 🎥 Video' : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  h1: { fontSize: 26, fontWeight: 'bold', marginBottom: 16, color: '#0f172a' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', textTransform: 'capitalize' },
  cardSub: { fontSize: 15, color: '#475569', marginTop: 4 },
  badge: { marginTop: 8, color: '#57665a', fontWeight: '600' },
  empty: { color: '#64748b', fontSize: 16 },
  error: { color: '#b91c1c', marginBottom: 12 },
});
