import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '@/lib/api';

interface Med { id: string; drugName: string; dose: string; frequency: string; instructions?: string | null; prescriberName?: string | null }
interface Lab { id: string; status: string; createdAt: string; items: { name: string }[] }

export default function Prescriptions() {
  const [meds, setMeds] = useState<Med[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [m, l] = await Promise.all([api.get<Med[]>('/me/medication-orders'), api.get<Lab[]>('/me/lab-orders')]);
      setMeds(m); setLabs(l);
    } catch {}
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.h1}>💊 Mis recetas</Text>
      {meds.length === 0 && <Text style={styles.empty}>No tienes recetas.</Text>}
      {meds.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.cardTitle}>{m.drugName} — {m.dose}</Text>
          <Text style={styles.cardSub}>{m.frequency}</Text>
          {m.instructions ? <Text style={styles.note}>📋 {m.instructions}</Text> : null}
          {m.prescriberName ? <Text style={styles.small}>Recetada por {m.prescriberName}</Text> : null}
        </View>
      ))}

      <Text style={[styles.h1, { marginTop: 24 }]}>🧪 Laboratorios</Text>
      {labs.length === 0 && <Text style={styles.empty}>No tienes órdenes de laboratorio.</Text>}
      {labs.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.small}>{new Date(o.createdAt).toLocaleDateString('es')}</Text>
          {o.items.map((i, idx) => <Text key={idx} style={styles.cardSub}>• {i.name}</Text>)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 14, color: '#0f172a' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 15, color: '#334155', marginTop: 2 },
  note: { marginTop: 8, backgroundColor: '#eef2ee', color: '#57665a', padding: 10, borderRadius: 8 },
  small: { fontSize: 13, color: '#64748b', marginTop: 6 },
  empty: { color: '#64748b', fontSize: 16 },
});
