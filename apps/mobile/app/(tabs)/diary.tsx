import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '@/lib/api';

interface Entry { id: string; entryAt: string; symptoms?: string | null; medications?: string | null; mood?: string | null }

const MOODS = [
  { v: 'muy bien', e: '😄' }, { v: 'bien', e: '🙂' }, { v: 'regular', e: '😐' },
  { v: 'mal', e: '😕' }, { v: 'muy mal', e: '😢' },
];

export default function Diary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { setEntries(await api.get<Entry[]>('/me/diary')); } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!mood && !symptoms && !medications) { setError('Escribe algo para guardar.'); return; }
    setError(''); setSaving(true);
    try {
      await api.post('/me/diary', { mood, symptoms, medications });
      setMood(''); setSymptoms(''); setMedications('');
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.h1}>Mi diario</Text>

      <View style={styles.card}>
        <Text style={styles.label}>¿Cómo te sientes hoy?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <Pressable key={m.v} onPress={() => setMood(m.v)} style={[styles.mood, mood === m.v && styles.moodActive]}>
              <Text style={{ fontSize: 26 }}>{m.e}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Síntomas</Text>
        <TextInput style={styles.input} multiline value={symptoms} onChangeText={setSymptoms} placeholder="Ej. dolor de cabeza" />
        <Text style={styles.label}>Medicamentos o suplementos</Text>
        <TextInput style={styles.input} multiline value={medications} onChangeText={setMedications} placeholder="Ej. Ibuprofeno 200mg" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>Registros anteriores</Text>
      {entries.map((e) => {
        const em = MOODS.find((m) => m.v === e.mood)?.e ?? '';
        return (
          <View key={e.id} style={styles.card}>
            <Text style={styles.small}>{new Date(e.entryAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })} {em}</Text>
            {e.symptoms ? <Text style={styles.cardSub}>Síntomas: {e.symptoms}</Text> : null}
            {e.medications ? <Text style={styles.cardSub}>Medicamentos: {e.medications}</Text> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  h1: { fontSize: 26, fontWeight: 'bold', marginBottom: 14, color: '#0f172a' },
  h2: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 12, color: '#0f172a' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 15, fontWeight: '600', color: '#334155', marginTop: 10, marginBottom: 6 },
  moodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mood: { padding: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },
  moodActive: { backgroundColor: '#cdd7ce' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 16, minHeight: 44 },
  button: { backgroundColor: '#6d7f6f', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 15, color: '#334155', marginTop: 2 },
  small: { fontSize: 13, color: '#64748b' },
  error: { color: '#b91c1c', marginTop: 10 },
});
