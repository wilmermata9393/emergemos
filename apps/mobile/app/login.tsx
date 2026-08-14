import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api, setSession } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; user: any }>('/auth/login', { identifier, password });
      if (res.user.role !== 'PATIENT') {
        setError('Esta app es para pacientes. Usa la versión web para el equipo.');
        setLoading(false);
        return;
      }
      await setSession(res.accessToken, res.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>Mi Salud</Text>
      <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        placeholder="+17875551234"
        keyboardType="phone-pad"
        autoCapitalize="none"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Entrando…' : 'Iniciar sesión'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 34, fontWeight: 'bold', textAlign: 'center', color: '#0f172a' },
  subtitle: { fontSize: 17, textAlign: 'center', color: '#64748b', marginTop: 6, marginBottom: 28 },
  label: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, fontSize: 17 },
  error: { color: '#b91c1c', backgroundColor: '#fee2e2', padding: 12, borderRadius: 10, marginTop: 14 },
  button: { backgroundColor: '#6d7f6f', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
