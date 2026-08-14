import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { getToken } from '@/lib/api';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    getToken().then((t) => setTarget(t ? '/(tabs)' : '/login'));
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <Redirect href={target as any} />;
}
